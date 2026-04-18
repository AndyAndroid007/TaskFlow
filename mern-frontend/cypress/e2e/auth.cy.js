describe('Auth End-to-End Run', () => {
    const invalidPayload = {
            email: "abc@example.com",
            password: "123456"
        };
    it('Should block access and display error toasts on invalid credential login', () => {

        cy.visit('/');
        cy.get('input[type="email"]').type(invalidPayload.email);
        cy.get('input[type="password"]').type(invalidPayload.password);
        cy.get('button[type="submit"]').click();

        cy.contains('Invalid Credentials').should('be.visible');
    });

    it('Should securely orchestrate a full Registration, Dashboard Redirection, and Logout lifecycle natively', () => {
        // Natively generate a unique email per test run so MongoDB accepts it cleanly!
        const uniqueEmail = `automation_${Date.now()}@test.com`;
        const testPassword = "CypressTestAuth321!";
        const testName = "Cypress Automation User";

        cy.visit('/');

        // Click the native React toggle button to switch to Registration mode
        cy.contains('New User? Signup first').click();

        // Fill in Name field (only visible in Signup mode)
        cy.get('input[name="name"]').type(testName);

        // Target the fields utilizing the identical typing robot logic
        cy.get('input[type="email"]').type(uniqueEmail);
        cy.get('input[type="password"]').type(testPassword);
        
        cy.get('button[type="submit"]').click();

        // Once the backend responds and localStorage receives the JWT, the frontend routes instantly to /dashboard! We mathematically assert the URL mutated!
        cy.url({ timeout: 8000 }).should('include', '/dashboard');
        
        // We assert the core NavBar component rendered correctly to prove the Dashboard loaded
        cy.contains('Analytics').should('be.visible');

        // Assert full secure disconnection flow — must click avatar first to open the dropdown
        cy.get('[data-cy="nav-avatar"]').click();
        cy.contains('Logout').click();
        cy.url().should('include', '/');
    });
});