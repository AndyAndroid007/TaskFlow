import { render, screen } from '@testing-library/react';
import SocialLoginButton from '../SocialLoginButton';

describe('Social Login Button Validation', () => {
    describe('Enabled Buttons', () => {
        it('Should render the Google Icon given the google provider details', () => {
            render(<SocialLoginButton provider="google"/>);
            const button = screen.getByRole('button', { name: /continue with google/i });
            expect(button).toBeEnabled();
        });

        it('Should render the GitHub Icon given the github provider details', () => {
            render(<SocialLoginButton provider="github"/>);
            const button = screen.getByRole('button', { name: /continue with github/i });
            expect(button).toBeEnabled();
        });

        it('Should render the LinkedIn Icon given the linkedin provider details', () => {
            render(<SocialLoginButton provider="linkedin"/>);
            const button = screen.getByRole('button', { name: /continue with linkedin/i });
            expect(button).toBeEnabled();
        });
    });

    describe('Disabled Buttons', () => {
        it('Should render the Google Icon but disabled when given the google provider details along with disabled', () => {
            render(<SocialLoginButton provider="google" disabled={true}/>);
            const button = screen.getByRole('button', { name: /continue with google/i });
            expect(button).toBeDisabled();
        });

        it('Should render the GitHub Icon but disabled when given the github provider details along with disabled', () => {
            render(<SocialLoginButton provider="github" disabled={true}/>);
            const button = screen.getByRole('button', { name: /continue with github/i });
            expect(button).toBeDisabled();
        });

        it('Should render the LinkedIn Icon but disabled when given the linkedin provider details along with disabled', () => {
            render(<SocialLoginButton provider="linkedin" disabled={true}/>);
            const button = screen.getByRole('button', { name: /continue with linkedin/i });
            expect(button).toBeDisabled();
        });
    })

})