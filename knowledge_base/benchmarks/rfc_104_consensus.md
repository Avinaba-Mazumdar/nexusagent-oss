# RFC-104: Raft Leader Election vs Multi-Paxos Quorum Consensus Invariants

## Abstract
This document specifies the architectural consensus invariants, state machine safety constraints, and failover latency profiles comparing the Raft Consensus Protocol (Ongaro & Ousterhout) with Multi-Paxos (Lamport) for distributed transactional state machines.

## 1. Quorum Formation & Invariants
In a distributed cluster of $N$ server nodes, both Raft and Multi-Paxos require a strict majority quorum $Q$ to ensure non-intersecting election and commit sets:
$$Q = \left\lfloor \frac{N}{2} \right\rfloor + 1$$

For standard odd cluster sizes:
- 3 nodes: Quorum size is 2 (fault tolerance $f = 1$)
- 5 nodes: Quorum size is 3 (fault tolerance $f = 2$)
- 7 nodes: Quorum size is 4 (fault tolerance $f = 3$)
- 9 nodes: Quorum size is 5 (fault tolerance $f = 4$)

Any two quorums $Q_1, Q_2$ within cluster $N$ satisfy the pigeonhole overlap condition:
$$|Q_1 \cap Q_2| \ge 1$$
This invariant guarantees that at least one node in any new quorum witnessed the most recently committed log term and index.

## 2. Leader Election Protocols
### 2.1 Raft Leader Election
Raft enforces election safety through randomized heartbeat election timers ($150\text{ms} - 300\text{ms}$) to prevent split-vote deadlocks.
A candidate node increments its `currentTerm`, transitions to Candidate state, votes for itself, and broadcasts `RequestVote(term, candidateId, lastLogIndex, lastLogTerm)`.
Followers vote for a candidate if and only if:
1. `term >= currentTerm`
2. Follower has not already voted for another candidate in `term`
3. Candidate's log is at least as up-to-date as the receiver's log (`lastLogTerm` higher, or equal with `lastLogIndex >= receiver.lastLogIndex`).

### 2.2 Multi-Paxos Leader Election
Multi-Paxos does not bundle leader election with log up-to-dateness. A leader proposal requires Phase 1a (`Prepare(proposal_number)`) and Phase 1b (`Promise(highest_accepted_proposal)`).
Any proposer can preempt an existing leader by issuing a higher proposal number, resulting in possible dueling proposers without randomized backoff or lease mechanisms.

## 3. Log Replication & Commit Invariants
### 3.1 Raft Log Commit
Once a Leader receives a client command:
1. Appends entry to its local log with `currentTerm`.
2. Sends `AppendEntries(term, leaderId, prevLogIndex, prevLogTerm, entries[], leaderCommit)`.
3. Once a majority ($Q$) acknowledges append, leader updates its `commitIndex` and applies entry to local state machine.
4. Responds to client with execution result.

Leader append entries invariant: If two entries in different logs have the same index and term, they store the identical command and their logs are identical in all preceding entries.

### 3.2 Multi-Paxos Log Commit
In Multi-Paxos steady state (after Phase 1 election establishes single leader), proposals proceed directly through Phase 2a (`Accept(instance_id, proposal_number, value)`) and Phase 2b (`Accepted`).
Round-trip latency in steady state is 1 RTT (same as Raft steady state).

## 4. Benchmark Comparisons & Failover Profiles
| Metric | Raft (Optimized) | Multi-Paxos (Standard) |
| :--- | :--- | :--- |
| Steady State Commit Latency | 1 RTT | 1 RTT |
| Failover Detection Time | 150ms - 300ms | 200ms - 500ms |
| Split Vote Recovery | Randomized timer jitter | Exponential backoff |
| State Machine Invariant | Strong Leader (Leader Completeness) | Weak Proposer (Log holes possible) |
| Implementation Complexity | Moderate (Defined state transitions) | High (Corner-case log gap filling) |

## 5. Architectural Recommendations
For modern cloud-native metadata management (e.g. etcd, CockroachDB, TiKV), Raft is the industry standard due to explicit leader completeness and clean log compaction semantics.
Multi-Paxos is optimal in geographic multi-region active-active deployments where symmetric consensus across regional sites minimizes cross-WAN roundtrips.
