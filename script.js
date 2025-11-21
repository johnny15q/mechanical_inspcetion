document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginMessage = document.getElementById('login-message');
    const vehicleDetailsForm = document.getElementById('vehicle-details-form');
    const checklistForm = document.getElementById('inspection-checklist');
    
    // Ensure the app is hidden when the page loads
    appContainer.classList.add('hidden');

    // --- 1. Helper Function: Set Current Date and Time ---
    function setCurrentDateTime() {
        const now = new Date();
        
        // Format Date as YYYY-MM-DD for input type="date"
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
            
        // Format Time as HH:MM for input type="time"
        const localTime = now.toTimeString().slice(0, 5);

        document.getElementById('inspection_date').value = localDate;
        document.getElementById('inspection_time').value = localTime;
    }

    // --- 2. Helper Logic: Make Checkboxes behave like Radio Buttons (Single Select) ---
    const checklistItems = document.querySelectorAll('.checklist-item');

    checklistItems.forEach(item => {
        const checkboxes = item.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    checkboxes.forEach(cb => {
                        if (cb !== this) {
                            cb.checked = false;
                        }
                    });
                }
            });
        });
    });

    // --- Mock Login System ---
    const TEST_USER = 'user';
    const TEST_PASSWORD = '123';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;

        if (usernameInput === TEST_USER && passwordInput === TEST_PASSWORD) {
            // Successful Login
            loginMessage.textContent = '';
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            // Auto-Fill Date and Time on Login
            setCurrentDateTime();
            
        } else {
            // Failed Login
            loginMessage.textContent = 'Invalid username or password.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        loginForm.reset();
        vehicleDetailsForm.reset();
        checklistForm.reset();
        
        document.getElementById('inspector_name').value = '';
        document.getElementById('inspection_date').value = '';
        document.getElementById('inspection_time').value = '';

        appContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });


    // --- Form Submission / Data Collection ---
    checklistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Gather Inspector Details
        const inspectorDetails = {
            inspectorName: document.getElementById('inspector_name').value,
            date: document.getElementById('inspection_date').value,
            time: document.getElementById('inspection_time').value
        };

        // Gather Vehicle Details
        const vehicleDetails = {
            vin: document.getElementById('vin').value,
            plate: document.getElementById('plate').value,
            make: document.getElementById('make').value,
            model: document.getElementById('model').value,
            year: document.getElementById('year').value,
            kms: document.getElementById('kms').value,
        };

        // Gather Inspection Checklist Data
        const inspectionData = {};
        const items = [
            'tyres', 'brakes', 'coolant', 'gearbox', 'engine_oil', 'brake_fluid', 
            'psf', 'pressure', 'headlights', 'blinkers', 'reverse'
        ];

        items.forEach(item => {
            const checkedBoxes = document.querySelectorAll(`input[name="${item}_check"]:checked`);
            let status = 'Not Checked';
            
            if (checkedBoxes.length > 0) {
                status = checkedBoxes[0].value;
            }
            
            inspectionData[item] = status;
        });

        // Final Summary logging to console for testing
        const finalComments = document.getElementById('final_comments').value;

        // Log the Report
        console.log("=================================================");
        console.log("         🚨 FULL INSPECTION REPORT LOG 🚨        ");
        console.log("=================================================");
        console.log("Inspector Details:", inspectorDetails);
        console.log("-------------------------------------------------");
        console.log("Vehicle Details:", vehicleDetails);
        console.log("-------------------------------------------------");
        console.log("Inspection Results:", inspectionData);
        console.log("-------------------------------------------------");
        console.log("Final Summary/Recommendations:", finalComments);
        console.log("=================================================");
        

        // --- CLEAR FORMS FOR NEXT INSPECTION ---
        vehicleDetailsForm.reset();       // Clears VIN, Make, Model, etc.
        checklistForm.reset();            // Clears checkboxes and final comments
        document.getElementById('inspector_name').value = ''; // Clears name only
        

    });
});