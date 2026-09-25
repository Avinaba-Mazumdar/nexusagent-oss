# Neon Serverless PostgreSQL Storage Architecture & Safekeeper WAL Protocol

## Abstract
This architecture specification details the decoupling of compute and storage in the Neon serverless PostgreSQL engine, focusing on the Pageserver log-structured storage layer, Safekeeper Paxos WAL replication, and copy-on-write virtual branch virtualization.

## 1. Architectural Topology Overview
Neon splits monolithic PostgreSQL into three discrete tiers:
1. **Stateless Compute Nodes**: Custom PostgreSQL binaries running in ephemeral lightweight VM microVMs (e.g. Firecracker). Compute nodes maintain zero persistent disk state; local NVMe caches serve only transient buffer pool pages.
2. **Safekeeper Consensus Ring**: A quorum of 3 Safekeeper daemons running a custom Paxos variant to achieve durable write-ahead log (WAL) consensus before transaction ack.
3. **Pageserver Layer**: Horizontally scalable, distributed log-structured storage engines responsible for materializing 8KB PostgreSQL pages on demand from historical WAL records and base layers.

## 2. Safekeeper Consensus Protocol
Compute nodes stream WAL records directly to the Safekeeper quorum over streaming replication connections:
1. Each compute transaction commit requires acknowledgment from $\lfloor N/2 \rfloor + 1$ Safekeepers.
2. Safekeepers persist WAL records to local low-latency NVMe append-only journals.
3. Once the majority quorum confirms receipt, the Safekeeper sends a commit acknowledgment back to the compute node.
4. Safekeepers asynchronously stream committed WAL streams down to the Pageserver.

This architecture decouples transaction latency from Pageserver checkpointing:
- Client commit latency = 1 network RTT to Safekeeper quorum + fsync on Safekeeper NVMe.
- Average commit latency: $< 5\text{ms}$ in same-region multi-AZ deployment.

## 3. Pageserver LSM-Tree Storage Engine
The Pageserver stores database state as a timeline of immutable log records:
- **Image Layers**: Complete snapshots of page ranges at a specific Log Sequence Number (LSN).
- **Delta Layers**: Collections of WAL records representing mutations between $\text{LSN}_1$ and $\text{LSN}_2$.
- When a compute node requests page $P$ at $\text{LSN}_t$:
  1. Pageserver finds the newest Image Layer for $P$ with $\text{LSN} \le t$.
  2. Applies intervening Delta Layer records up to $t$ in memory.
  3. Returns materialized 8KB page to compute buffer cache.
- Base layers are periodically uploaded to AWS S3 / Cloudflare R2 object storage for infinite durable cold retention.

## 4. Instant Copy-on-Write Branching
Because Pageserver storage is log-structured and keyed by `(TimelineID, Key, LSN)`:
- Creating a child branch requires only recording a new `TimelineID` pointing to the ancestor timeline's branching LSN.
- Zero data copy is performed on branch creation.
- Branch creation time: $< 1\text{ second}$ regardless of database size (10 GB to 10 TB).
- Child branches record only delta mutations, isolating testing, schema migrations, and CI/CD preview environments.

## 5. Performance Invariants & Benchmarks
| Attribute | Monolithic RDS Postgres | Neon Serverless Postgres |
| :--- | :--- | :--- |
| Compute Startup Time | 2 - 5 minutes | 500ms - 2 seconds (Fastpath) |
| Cold Branch Creation | Minutes to Hours (Snapshot) | < 1 second (Copy-on-write pointer) |
| WAL Replication Latency | 10ms - 30ms (EBS multi-attach) | < 4.2ms (NVMe Safekeeper Paxos) |
| Max Supported IOPS | Bound by EBS volume tier | Dynamically scaled across Pageserver nodes |
| Cold Storage Cost | High (Provisioned SSD rate) | Low (S3 object storage archive) |

## 6. Mathematical Invariants for High-Throughput Batching
Given compute write burst of 14,000 IOPS and Safekeeper network window of 4.2ms:
$$\text{Batch Size} = \left\lceil \frac{14000 \times 4.2}{1000} \right\rceil = 59 \text{ ops/window}$$
Compute WAL flushers aggregate transactions into 59-operation vector flushes, minimizing syscall overhead.
