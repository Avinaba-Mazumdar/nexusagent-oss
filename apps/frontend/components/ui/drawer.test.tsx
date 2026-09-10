import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';

describe('Drawer component', () => {
    it('renders drawer trigger and content structure', () => {
        render(
            <Drawer open={true}>
                <DrawerTrigger>Open Drawer</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>System Drawer</DrawerTitle>
                        <DrawerDescription>Drawer description for tests</DrawerDescription>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );

        expect(screen.getByText('System Drawer')).toBeInTheDocument();
        expect(screen.getByText('Drawer description for tests')).toBeInTheDocument();
    });
});
