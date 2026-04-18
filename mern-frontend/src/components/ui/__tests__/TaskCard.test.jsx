import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';

describe('Task Card Validations', () => {
    it('Should cleanly render a Task Card given a raw backend Task payload', () => {
        const mockTask = {
            _id: "test-card-1",
            title: "Fix Critical Login Bug",
            status: "Open",
            priority: "High",
            dueDate: new Date().toISOString()
        };
        
        render(<TaskCard task = {mockTask} />);

        const titleElement = screen.getByText("Fix Critical Login Bug");

        expect(titleElement).toBeInTheDocument();

    });

    it('Should render emerald green task badge on Completed Status', () => {
        const mockTask = {
            _id: "text-mock-2",
            title: "Implement Testing Phase",
            status: "Completed",
            priority: "Medium",
            dueDate: new Date().toISOString()
        };

        render(<TaskCard task={mockTask}/>);
        const statusElement = screen.getByText('Completed');

        expect(statusElement).toHaveClass('bg-emerald-500/10');
    });

    it('Should trigger callbacks when clicking Edit and Delete buttons', () => {
        const mockEdit = vi.fn();
        const mockDelete = vi.fn();
        const mockTask = { _id: "3", title: "Clickable Test", status: "Open" };

        render(<TaskCard task={mockTask} onEdit={mockEdit} onDelete={mockDelete} />);

        // Fire an edit by clicking the wrapper 
        const titleElement = screen.getByText("Clickable Test");
        fireEvent.click(titleElement.closest('div.group')); // Click the container
        expect(mockEdit).toHaveBeenCalledTimes(1);

        // Fire a delete by clicking the SVG wrapper button
        const deleteBtn = screen.getByRole('button');
        fireEvent.click(deleteBtn);
        expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('Should safely render Tags and Descriptions when provided natively in the UI', () => {
        const mockTask = { 
            _id: "4", 
            title: "Metadata Test", 
            description: "Some very long description snippet",
            tags: ["frontend", "react"]
        };

        render(<TaskCard task={mockTask} />);

        expect(screen.getByText("Some very long description snippet")).toBeInTheDocument();
        expect(screen.getByText("#frontend")).toBeInTheDocument();
        expect(screen.getByText("#react")).toBeInTheDocument();
    });

    it('Should cleanly style the Red Priority Indicator dynamically if priority is High', () => {
        const mockTask = { _id: "5", title: "Priority Test", priority: "High" };
        
        render(<TaskCard task={mockTask} />);
        
        // Find the 'High' text, and lookup its parent container to check the sibling span color
        const priorityText = screen.getByText('High');
        expect(priorityText).toBeInTheDocument();
        // Natively the color is heavily embedded in previous sibling
        expect(priorityText.previousSibling).toHaveClass('bg-red-500');
    });
});