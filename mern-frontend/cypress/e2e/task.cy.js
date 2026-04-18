describe('Task Operations End-to-End Run', () => {

    const testPassword = "CypressTestAuth321!";

    beforeEach(() => {
        // Natively construct a new user per test to ensure isolated sandbox behavior
        const uniqueEmail = `taskops_${Date.now()}@test.com`;
        
        cy.visit('/');
        cy.contains('New User? Signup first').click();
        cy.get('input[name="name"]').type('Task Test User');
        cy.get('input[type="email"]').type(uniqueEmail);
        cy.get('input[type="password"]').type(testPassword);
        cy.get('button[type="submit"]').click();
        
        // Ensure successful load of the Dashboard
        cy.url({ timeout: 8000 }).should('include', '/dashboard');
    });

    it('Should cleanly block Task submission and trigger frontend Alerts if mandatory fields are vacant', () => {
        cy.contains('Add Task').click();

        // Deliberately ignore Title and Assignee, purely click Save!
        cy.contains('Create Task').click();

        // Assert our custom AlertBox natively intercepts and renders the Toast warning
        cy.contains('Please fill in all mandatory fields!', { timeout: 5000 }).should('be.visible');
    });

    it('Should natively create a new Task, securely attaching Tags, and validating Dashboard UI projection', () => {
        cy.contains('Add Task').click();

        cy.contains('Title').parent().find('input').type('Dynamic Cypress Extraction');
        cy.contains('Description').parent().find('textarea').type('Testing full DOM extraction properties.');
        
        // Select the very first user dynamically
        cy.contains('Assignee').parent().find('select').select(1);
        cy.contains('Due Date').parent().find('input').type("2026-10-31");

        // Map an interactive Tag
        cy.contains('Tags').parent().find('input').type("automated");
        cy.contains('Tags').parent().parent().contains('Add').click(); // Uses the layout bounding strictly
        
        // Assert the green UI pill actually formed in the sidebar before submission
        cy.contains('#automated').should('be.visible');

        cy.contains('Create Task').click();

        // The TaskCard should mount to the Grid. We prove it by checking the title AND the Tag!
        cy.contains('Dynamic Cypress Extraction').should('be.visible');
        cy.contains('#automated').should('be.visible');
    });

    it('Should mechanically reopen an existing Task, inject modifications into the Sidedraw, and save appropriately', () => {
        // 1. Create it first internally so we can definitively click it
        cy.contains('Add Task').click();
        cy.contains('Title').parent().find('input').type('Modifiable Target');
        cy.contains('Assignee').parent().find('select').select(1);
        cy.contains('Due Date').parent().find('input').type("2028-12-31");
        cy.contains('Create Task').click();

        // 2. Click the specific TaskCard natively on the screen boundary to trigger onEdit
        cy.contains('Modifiable Target').click();

        // 3. The sidebar returns. Wipe the title and rewrite it!
        cy.contains('Title').parent().find('input').clear().type('Successfully Updated Title');
        cy.contains('Save Changes').click();

        // 4. Assert the DOM rerendered the specific text
        cy.contains('Successfully Updated Title', { timeout: 8000 }).should('be.visible');
        cy.contains('Modifiable Target').should('not.exist');
    });

    it('Should intercept Delete clicks on the SVG trashcan and mechanically erase the Card from the UI', () => {
        // Create it
        cy.contains('Add Task').click();
        cy.contains('Title').parent().find('input').type('Target For Deletion');
        cy.contains('Assignee').parent().find('select').select(1);
        cy.contains('Due Date').parent().find('input').type("2030-01-01");
        cy.contains('Create Task').click();

        cy.contains('Target For Deletion').should('be.visible');

        // Locate the exact TaskCard wrapper by tracking the Title text, jumping to the parent DIV layer, searching for the child button component containing the Trashcan SVG, and clicking!
        cy.contains('Target For Deletion').parents('.group').find('button').click();

        // Accept the confirm if necessary! Window confirms are auto-accepted by Cypress by default, but if we used SweetAlert we would need to click the UI Confirm. Assuming it deletes instantly:
        cy.contains('Target For Deletion').should('not.exist');
    });

});