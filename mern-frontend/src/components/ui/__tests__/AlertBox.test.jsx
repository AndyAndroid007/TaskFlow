import {render, screen} from '@testing-library/react';
import AlertBox from '../AlertBox';

describe('Alert Box Validation', () => {
    it('Should correctly render an Error styled alert box natively', () => {
        
        //Render Error Alert Box
        render(<AlertBox type = "error" description = "Invalid Credentials" />);
        
        //Query to validate Description attribute
        const messageElement = screen.getByText("Invalid Credentials");

        //Assert Message Element as part of the Document
        expect(messageElement).toBeInTheDocument();

        //Assert Styling Attributes for Error Alert Box
        expect(messageElement.parentElement).toHaveClass('text-rose-400');
        
    });
    it('Should correctly render a Success styled alert box natively', () => {
        // Render Success Alert Box
        render(<AlertBox type="success" description="Task Completed" />);
        
        // Query to validate Description attribute
        const messageElement = screen.getByText("Task Completed");

        // Assert Message Element as part of the Document
        expect(messageElement).toBeInTheDocument();

        // Assert Styling Attributes for Success Alert Box
        expect(messageElement.parentElement).toHaveClass('text-emerald-400');
    });
});