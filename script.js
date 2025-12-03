       // --- Data Constants ---
        const INITIAL_VEHICLE_INFO = {
            vin: '', make: '', model: '', year: new Date().getFullYear(),
            mileage: '', plate: '', customerName: '', technician: ''
        };

        const INITIAL_CATEGORIES = [
            {
                id: 'fluids', title: 'Fluids & Filters', icon: 'droplet',
                items: [
                    { id: 'oil_lvl', label: 'Engine Oil Level & Condition' },
                    { id: 'coolant', label: 'Coolant Level & Freeze Point' },
                    { id: 'brake_fluid', label: 'Brake Fluid Level & Moisture' },
                    { id: 'ps_fluid', label: 'Power Steering Fluid' }, // Added
                    { id: 'trans_fluid', label: 'Transmission Fluid' },
                    { id: 'diff_oil', label: 'Differential Oil' }, // Added
                    { id: 'air_filter', label: 'Engine Air Filter' },
                    { id: 'cabin_filter', label: 'Cabin Air Filter' },
                ]
            },
            {
                id: 'tires', title: 'Tires & Brakes', icon: 'disc',
                items: [
                    { id: 'tire_tread_lf', label: 'Tire Tread Depth (LF)' },
                    { id: 'tire_tread_rf', label: 'Tire Tread Depth (RF)' },
                    { id: 'tire_tread_lr', label: 'Tire Tread Depth (LR)' },
                    { id: 'tire_tread_rr', label: 'Tire Tread Depth (RR)' },
                    { id: 'brake_pad_front', label: 'Brake Pads (Front)' },
                    { id: 'brake_pad_rear', label: 'Brake Pads (Rear)' },
                    { id: 'rotors', label: 'Rotors / Drums Condition' },
                    { id: 'park_brake', label: 'Parking Brake Operation' },
                ]
            },
            {
                id: 'engine', title: 'Engine & Undercarriage', icon: 'engine',
                items: [
                    { id: 'belts', label: 'Drive Belts (Cracks/Wear)' },
                    { id: 'hoses', label: 'Radiator/Heater Hoses' },
                    { id: 'battery', label: 'Battery Health & Terminals' },
                    { id: 'exhaust', label: 'Exhaust System (Leaks/Rust)' },
                    { id: 'shocks', label: 'Shocks & Struts' },
                    { id: 'suspension', label: 'Suspension Components' }, // Added
                    { id: 'cv_joints', label: 'CV Joints & Boots' },
                    { id: 'driveline', label: 'Driveline' }, // Added
                    { id: 'leaks', label: 'Oil/Fluid Leaks (Visual)' },
                ]
            },
            {
                id: 'exterior', title: 'Exterior & Lights', icon: 'lightbulb',
                items: [
                    { id: 'headlights', label: 'Headlights (High/Low)' },
                    { id: 'taillights', label: 'Tail/Brake Lights' },
                    { id: 'signals', label: 'Turn Signals' },
                    { id: 'wipers', label: 'Wiper Blades' },
                    { id: 'windshield', label: 'Windshield Glass' },
                    { id: 'body_dmg', label: 'Body Damage / Scratches' },
                ]
            },
            {
                id: 'interior', title: 'Interior & Safety', icon: 'shield',
                items: [
                    { id: 'dash_lights', label: 'Dashboard Warning Lights' },
                    { id: 'ac_heat', label: 'A/C & Heater Operation' },
                    { id: 'windows', label: 'Power Windows/Locks' },
                    { id: 'horn', label: 'Horn Operation' },
                    { id: 'seatbelts', label: 'Seatbelts' },
                ]
            }
        ];

        // --- State Management ---
        const state = {
            isAuthenticated: false,
            authMode: 'login',
            authError: '',
            credentials: { username: '', password: '' },
            currentView: 'intake',
            vehicleInfo: { ...INITIAL_VEHICLE_INFO },
            inspectionData: {},
            activeCategory: INITIAL_CATEGORIES[0].id,
            isSidebarOpen: false,
            lastSaved: null,
            reportTab: 'fail' // 'fail', 'warning', 'pass'
        };

        // --- Initialization ---
        function init() {
            const savedVehicle = localStorage.getItem('mech_app_vehicle');
            const savedInspection = localStorage.getItem('mech_app_inspection');
            const savedAuth = localStorage.getItem('mech_app_auth');

            if (savedVehicle) state.vehicleInfo = JSON.parse(savedVehicle);
            if (savedInspection) state.inspectionData = JSON.parse(savedInspection);
            if (savedAuth === 'true') state.isAuthenticated = true;

            render();
        }

        function saveState() {
            if (state.isAuthenticated) {
                try {
                    localStorage.setItem('mech_app_vehicle', JSON.stringify(state.vehicleInfo));
                    localStorage.setItem('mech_app_inspection', JSON.stringify(state.inspectionData));
                    localStorage.setItem('mech_app_auth', 'true');
                    state.lastSaved = new Date().toLocaleTimeString();
                    updateSaveStatus();
                } catch (e) {
                    console.error("Storage limit exceeded", e);
                    alert("Storage limit reached. Some photos may not be saved. Try deleting old inspections.");
                }
            }
        }

        function updateSaveStatus() {
            const el = document.getElementById('save-status');
            if (el) el.textContent = `Saved ${state.lastSaved || 'Just now'}`;
        }

        // --- Helpers ---
        function getCategoryStatus(catId) {
            const catItems = INITIAL_CATEGORIES.find(c => c.id === catId).items;
            const catData = state.inspectionData[catId] || {};
            let completed = 0;
            catItems.forEach(item => {
                if (catData[item.id]?.status) completed++;
            });
            return { total: catItems.length, completed };
        }

        function getTotalProgress() {
            let total = 0, completed = 0;
            INITIAL_CATEGORIES.forEach(cat => {
                const stats = getCategoryStatus(cat.id);
                total += stats.total;
                completed += stats.completed;
            });
            return total === 0 ? 0 : Math.round((completed / total) * 100);
        }

        function getTotalCost() {
            let total = 0;
            Object.values(state.inspectionData).forEach(cat => {
                Object.values(cat).forEach(item => {
                    total += Number(item.cost) || 0;
                });
            });
            return total;
        }

        // --- Image Compression ---
        function compressImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 600; // Limit width to save storage
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        // Compress to JPEG 0.6 quality
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                    img.onerror = error => reject(error);
                };
                reader.onerror = error => reject(error);
            });
        }

        // --- Render Functions ---

        function render() {
            // 1. Capture current scroll position of the MAIN content area using specific ID
            const scrollContainer = document.getElementById('main-scroll');
            const scrollPos = scrollContainer ? scrollContainer.scrollTop : 0;

            const root = document.getElementById('root');
            root.innerHTML = '';

            if (!state.isAuthenticated) {
                root.innerHTML = renderLogin();
            } else {
                root.innerHTML = `
                    ${renderHeader()}
                    <main class="max-w-7xl mx-auto p-4 md:p-6 w-full flex-1">
                        ${state.currentView === 'intake' ? renderIntake() : ''}
                        ${state.currentView === 'inspection' ? renderInspection() : ''}
                        ${state.currentView === 'report' ? renderReport() : ''}
                    </main>
                    ${state.currentView === 'inspection' ? renderMobileFooter() : ''}
                `;
            }
            
            // 2. Restore scroll position to specific ID
            const newScrollContainer = document.getElementById('main-scroll');
            if (newScrollContainer && state.currentView === 'inspection') {
                newScrollContainer.scrollTop = scrollPos;
            }

            lucide.createIcons();
            bindEvents();
        }

        function renderLogin() {
            return `
                <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                        <div class="bg-slate-900 p-6 text-center">
                            <div class="flex justify-center mb-3">
                                <div class="bg-blue-600 p-3 rounded-full">
                                    <i data-lucide="wrench" class="w-8 h-8 text-white"></i>
                                </div>
                            </div>
                            <h1 class="text-2xl font-bold text-white">AutoInspect<span class="text-blue-500">Pro</span></h1>
                            <p class="text-slate-400 text-sm mt-1">Technician Portal</p>
                        </div>
                        <div class="p-8">
                            <div class="flex gap-4 mb-6 border-b">
                                <button onclick="setAuthMode('login')" class="flex-1 pb-2 text-sm font-medium transition-colors ${state.authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}">Login</button>
                                <button onclick="setAuthMode('register')" class="flex-1 pb-2 text-sm font-medium transition-colors ${state.authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}">Register</button>
                            </div>
                            <form onsubmit="handleLogin(event)" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <div class="relative">
                                        <i data-lucide="user" class="absolute left-3 top-2.5 w-5 h-5 text-gray-400"></i>
                                        <input type="text" id="auth-username" value="${state.credentials.username}" required class="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter username">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div class="relative">
                                        <i data-lucide="lock" class="absolute left-3 top-2.5 w-5 h-5 text-gray-400"></i>
                                        <input type="password" id="auth-password" value="${state.credentials.password}" required class="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter password">
                                    </div>
                                </div>
                                ${state.authError ? `<div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i> ${state.authError}</div>` : ''}
                                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition-colors">${state.authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
                                <div class="text-center text-xs text-gray-400 mt-4">Use <span class="font-mono bg-gray-100 px-1 rounded">user</span> / <span class="font-mono bg-gray-100 px-1 rounded">pass123</span></div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderHeader() {
            const progress = getTotalProgress();
            return `
                <header class="bg-white border-b sticky top-0 z-30 no-print">
                    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="bg-blue-600 p-2 rounded-lg"><i data-lucide="wrench" class="w-5 h-5 text-white"></i></div>
                            <span class="text-xl font-bold tracking-tight text-slate-900">AutoInspect<span class="text-blue-600">Pro</span></span>
                        </div>
                        <div class="flex items-center gap-4">
                            ${state.currentView === 'inspection' ? `
                                <div class="hidden md:flex items-center gap-3 min-w-[200px]">
                                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-600 transition-all duration-500 ease-out" style="width: ${progress}%"></div>
                                    </div>
                                    <span class="text-xs font-bold text-gray-500">${progress}%</span>
                                </div>
                            ` : ''}
                            <div class="hidden sm:flex items-center gap-2 text-xs text-gray-400 border-l pl-4">
                                <i data-lucide="save" class="w-3 h-3"></i>
                                <span id="save-status">Saved ${state.lastSaved || 'Just now'}</span>
                            </div>
                            <div class="h-6 w-px bg-gray-200 mx-2"></div>
                            <button onclick="resetInspection()" class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Reset Form"><i data-lucide="rotate-ccw" class="w-5 h-5"></i></button>
                            <button onclick="handleLogout()" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Logout"><i data-lucide="log-out" class="w-5 h-5"></i></button>
                        </div>
                    </div>
                </header>
            `;
        }

        function renderIntake() {
            return `
                <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                    <div class="bg-slate-900 p-6 text-white">
                        <h2 class="text-xl font-bold flex items-center gap-2"><i data-lucide="car" class="w-6 h-6"></i> Vehicle Intake</h2>
                        <p class="text-slate-400 text-sm mt-1">Enter vehicle details to begin inspection</p>
                    </div>
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            ${renderInput('VIN', 'vin', state.vehicleInfo.vin, '17 Characters', 'uppercase')}
                            <div class="grid grid-cols-2 gap-4">
                                ${renderInput('Year', 'year', state.vehicleInfo.year, '', 'number')}
                                ${renderInput('Make', 'make', state.vehicleInfo.make, 'e.g. Toyota')}
                            </div>
                            ${renderInput('Model', 'model', state.vehicleInfo.model, 'e.g. Camry')}
                        </div>
                        <div class="space-y-4">
                             <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
                                <div class="relative">
                                    <input type="number" data-field="mileage" value="${state.vehicleInfo.mileage}" class="vehicle-input w-full p-2 pl-3 border border-gray-300 rounded-lg" placeholder="0">
                                    <span class="absolute right-3 top-2 text-gray-400 text-sm">mi</span>
                                </div>
                            </div>
                            ${renderInput('Customer Name', 'customerName', state.vehicleInfo.customerName)}
                            ${renderInput('Technician', 'technician', state.vehicleInfo.technician)}
                        </div>
                    </div>
                    <div class="p-6 border-t bg-gray-50 flex justify-end">
                        <button onclick="startInspection()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                            Start Inspection <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        function renderInput(label, field, value, placeholder = '', type = 'text') {
            return `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                    <input type="${type}" data-field="${field}" value="${value}" class="vehicle-input w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="${placeholder}">
                </div>
            `;
        }

        function renderInspection() {
            const activeCat = INITIAL_CATEGORIES.find(c => c.id === state.activeCategory);
            const isFirst = state.activeCategory === INITIAL_CATEGORIES[0].id;
            const isLast = state.activeCategory === INITIAL_CATEGORIES[INITIAL_CATEGORIES.length - 1].id;
            
            let sidebarHtml = INITIAL_CATEGORIES.map(cat => {
                const status = getCategoryStatus(cat.id);
                const isComplete = status.completed === status.total;
                const isActive = state.activeCategory === cat.id;
                const pct = (status.completed / status.total) * 100;
                
                return `
                    <button onclick="setActiveCategory('${cat.id}')" class="w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-600'}">
                        <div class="flex items-center gap-3">
                            <div class="relative w-8 h-8 flex items-center justify-center">
                                <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path class="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                    <path class="${isComplete ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-400'}" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                </svg>
                                <span class="absolute text-[10px] font-medium">${status.completed}/${status.total}</span>
                            </div>
                            <span class="font-medium text-sm">${cat.title}</span>
                        </div>
                    </button>
                `;
            }).join('');

            let itemsHtml = activeCat.items.map(item => {
                const catData = state.inspectionData[state.activeCategory] || {};
                const itemData = catData[item.id] || {};
                const status = itemData.status;
                // Ensure photos is an array, handle legacy data
                const photos = Array.isArray(itemData.photos) ? itemData.photos : [];

                return `
                    <div class="border rounded-xl p-4 md:p-5 transition-all hover:shadow-md bg-white mb-6">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <h4 class="font-semibold text-gray-800 text-lg">${item.label}</h4>
                            <div class="flex gap-2">
                                <button onclick="updateItem('${item.id}', 'status', 'pass')" class="flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 border transition-colors ${status === 'pass' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}"><i data-lucide="check-circle-2" class="w-4 h-4"></i> Pass</button>
                                <button onclick="updateItem('${item.id}', 'status', 'warning')" class="flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 border transition-colors ${status === 'warning' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Warn</button>
                                <button onclick="updateItem('${item.id}', 'status', 'fail')" class="flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 border transition-colors ${status === 'fail' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}"><i data-lucide="x-circle" class="w-4 h-4"></i> Fail</button>
                            </div>
                        </div>
                        ${status ? `
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t animate-fade-in">
                                <div class="md:col-span-6">
                                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Mechanic Notes</label>
                                    <textarea data-cat="${state.activeCategory}" data-item="${item.id}" class="item-note w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 min-h-[80px]" placeholder="Add observations...">${itemData.notes || ''}</textarea>
                                </div>
                                <div class="md:col-span-3">
                                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Photos (${photos.length}/5)</label>
                                    <div class="grid grid-cols-3 gap-2 mb-2">
                                        ${photos.map((p, idx) => `
                                            <div class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-100">
                                                <img src="${p}" class="w-full h-full object-cover">
                                                <button onclick="deletePhoto('${item.id}', ${idx})" class="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                                                    <i data-lucide="x" class="w-3 h-3"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                        
                                        ${photos.length < 5 ? `
                                            <!-- Gallery Button -->
                                            <button onclick="document.getElementById('file-${item.id}').click()" title="Gallery" class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors bg-gray-50 hover:bg-white">
                                                <i data-lucide="image" class="w-5 h-5 mb-0.5"></i>
                                                <span class="text-[9px] font-bold">GALLERY</span>
                                            </button>
                                            
                                            <!-- Camera Button -->
                                            <button onclick="document.getElementById('camera-${item.id}').click()" title="Camera" class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors bg-gray-50 hover:bg-white">
                                                <i data-lucide="camera" class="w-5 h-5 mb-0.5"></i>
                                                <span class="text-[9px] font-bold">CAMERA</span>
                                            </button>
                                        ` : ''}
                                    </div>
                                    <input type="file" id="file-${item.id}" class="hidden" accept="image/*" onchange="handlePhotoUpload(event, '${item.id}')">
                                    <input type="file" id="camera-${item.id}" class="hidden" accept="image/*" capture="environment" onchange="handlePhotoUpload(event, '${item.id}')">
                                </div>
                                ${(status === 'fail' || status === 'warning') ? `
                                    <div class="md:col-span-3">
                                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Cost ($)</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                            <input type="number" data-cat="${state.activeCategory}" data-item="${item.id}" value="${itemData.cost || ''}" class="item-cost w-full pl-7 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-red-500 border-red-200 bg-red-50" placeholder="0.00">
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

            return `
                <div class="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6">
                    <!-- Sidebar -->
                    <div class="fixed md:relative inset-0 z-20 bg-white md:bg-transparent md:w-64 flex-shrink-0 transform transition-transform duration-200 ease-in-out ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}">
                        <div class="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div class="p-4 border-b flex justify-between items-center bg-slate-50">
                                <h3 class="font-bold text-slate-700">Categories</h3>
                                <button onclick="toggleSidebar(false)" class="md:hidden p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
                            </div>
                            <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">${sidebarHtml}</div>
                        </div>
                    </div>

                    <!-- Overlay for mobile sidebar -->
                    ${state.isSidebarOpen ? '<div onclick="toggleSidebar(false)" class="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"></div>' : ''}

                    <!-- Content -->
                    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <button onclick="toggleSidebar(true)" class="md:hidden p-2 bg-white rounded-md border"><i data-lucide="menu" class="w-4 h-4"></i></button>
                                <h2 class="text-lg font-bold text-gray-800">${activeCat.title}</h2>
                            </div>
                            <div class="text-sm text-gray-500">${getCategoryStatus(state.activeCategory).completed} of ${activeCat.items.length} checked</div>
                        </div>

                        <!-- IMPORTANT: ID added for scroll targeting -->
                        <div id="main-scroll" class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 custom-scroll">
                            ${itemsHtml}
                        </div>

                        <div class="p-4 border-t bg-gray-50 flex justify-between">
                            <button onclick="navBack()" class="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 flex items-center gap-2">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i> ${isFirst ? 'Back to Intake' : 'Back'}
                            </button>
                            ${isLast ? `
                                <button onclick="setView('report')" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">View Report <i data-lucide="clipboard-list" class="w-4 h-4"></i></button>
                            ` : `
                                <button onclick="navNext()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">Next Category <i data-lucide="chevron-down" class="w-4 h-4"></i></button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }

        function renderReport() {
            const totalCost = getTotalCost();
            
            // 1. Group items by status
            const grouped = { fail: [], warning: [], pass: [] };
            
            INITIAL_CATEGORIES.forEach(cat => {
                const catData = state.inspectionData[cat.id] || {};
                Object.keys(catData).forEach(itemId => {
                    const item = catData[itemId];
                    const itemDef = cat.items.find(i => i.id === itemId);
                    if (itemDef && item.status && grouped[item.status]) {
                         // Add definition details
                         grouped[item.status].push({ ...item, label: itemDef.label, category: cat.title });
                    }
                });
            });

            // 2. Generate list HTML based on active tab
            const activeTab = state.reportTab || 'fail';
            const currentList = grouped[activeTab] || [];
            let listHtml = '';

            if (currentList.length === 0) {
                 listHtml = `
                    <div class="p-8 text-center bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                        <i data-lucide="${activeTab === 'pass' ? 'check-circle' : 'alert-circle'}" class="w-8 h-8 text-gray-300 mb-2"></i>
                        <p class="text-gray-500 font-medium">No items found in this category.</p>
                    </div>
                 `;
            } else {
                 listHtml = currentList.map(item => {
                    const statusClass = item.status === 'fail' ? 'bg-red-100 text-red-800 border-red-200' : 
                                      item.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                      'bg-green-100 text-green-800 border-green-200';
                    const statusLabel = item.status.toUpperCase();
                    const photos = Array.isArray(item.photos) ? item.photos : [];

                    return `
                        <div class="flex justify-between items-start p-3 bg-white border rounded-lg shadow-sm mb-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="px-2 py-1 rounded-md text-xs font-bold border ${statusClass}">${statusLabel}</span>
                                    <span class="font-semibold text-gray-800">${item.label}</span>
                                </div>
                                <p class="text-sm text-gray-500 ml-1">${item.category}</p>
                                ${item.notes ? `<p class="text-sm mt-2 p-2 bg-gray-50 rounded italic text-gray-600">"${item.notes}"</p>` : ''}
                                ${photos.length > 0 ? `
                                    <div class="mt-3 flex gap-2 flex-wrap">
                                        ${photos.map(p => `<img src="${p}" class="w-16 h-16 object-cover rounded border border-gray-200">`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            ${item.cost > 0 ? `<div class="text-right font-bold text-gray-800 ml-4">$${parseFloat(item.cost).toFixed(2)}</div>` : ''}
                        </div>
                    `;
                 }).join('');
            }

            // 3. Tab Navigation UI
            const tabBtnClass = (tab) => `flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${state.reportTab === tab ? 
                (tab === 'fail' ? 'border-red-600 text-red-600 bg-red-50' : tab === 'warning' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 'border-green-600 text-green-700 bg-green-50') 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`;

            const tabsHtml = `
                <div class="flex border-b border-gray-200 mb-6 report-tabs no-print">
                    <button onclick="setReportTab('fail')" class="${tabBtnClass('fail')}">
                        <i data-lucide="x-circle" class="w-4 h-4"></i> Fail (${grouped.fail.length})
                    </button>
                    <button onclick="setReportTab('warning')" class="${tabBtnClass('warning')}">
                        <i data-lucide="alert-triangle" class="w-4 h-4"></i> Warn (${grouped.warning.length})
                    </button>
                    <button onclick="setReportTab('pass')" class="${tabBtnClass('pass')}">
                        <i data-lucide="check-circle-2" class="w-4 h-4"></i> Pass (${grouped.pass.length})
                    </button>
                </div>
            `;
            
            // 4. Fallback for Print View (Static "Issues" List)
            let printIssuesHtml = '';
            // Combined Fail/Warn for print
            [...grouped.fail, ...grouped.warning].forEach(item => {
                 // Reuse simplified markup for print
                 const statusLabel = item.status === 'fail' ? 'FAIL' : 'WARN';
                 printIssuesHtml += `
                    <div class="flex justify-between items-start p-2 border-b break-inside-avoid">
                        <div>
                            <span class="font-bold text-xs mr-2">[${statusLabel}]</span>
                            <span class="font-semibold text-sm">${item.label}</span>
                            ${item.notes ? `<div class="text-xs text-gray-500 italic mt-1">"${item.notes}"</div>` : ''}
                        </div>
                        ${item.cost > 0 ? `<div class="font-bold text-sm">$${parseFloat(item.cost).toFixed(2)}</div>` : ''}
                    </div>
                 `;
            });
            if(!printIssuesHtml) printIssuesHtml = '<div class="text-sm italic text-gray-500">No issues found.</div>';

            // Detailed Log for Print
            let detailLogHtml = INITIAL_CATEGORIES.map(cat => {
                const items = cat.items.map(item => {
                    const stat = state.inspectionData[cat.id]?.[item.id]?.status || 'pending';
                    return `<div class="flex justify-between py-1 border-b border-gray-100"><span>${item.label}</span><span class="uppercase font-bold text-xs">${stat}</span></div>`;
                }).join('');
                return `<div class="mb-4 break-inside-avoid"><h4 class="font-bold uppercase text-gray-500 border-b mb-2">${cat.title}</h4>${items}</div>`;
            }).join('');

            return `
                <div class="max-w-4xl mx-auto bg-white shadow-lg border border-gray-200 rounded-none md:rounded-xl print:shadow-none print:border-none print:w-full">
                    <div class="bg-slate-900 text-white p-8 print:bg-white print:text-black print:p-0 print:mb-6">
                        <div class="flex justify-between items-start">
                            <div>
                                <h1 class="text-3xl font-bold mb-2">Vehicle Inspection Report</h1>
                                <p class="text-slate-400 print:text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
                            </div>
                            <div class="text-right hidden print:block">
                                <div class="text-2xl font-bold">AUTO CHECK PRO</div>
                                <div class="text-sm text-gray-500">123 Mechanic Ln, Garage City</div>
                            </div>
                        </div>
                    </div>
                    <div class="p-8 space-y-8">
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-6 p-4 bg-gray-50 rounded-lg border print:border-gray-300">
                            <div><label class="text-xs font-bold text-gray-500 uppercase">Customer</label><p class="font-semibold text-gray-900">${state.vehicleInfo.customerName || 'N/A'}</p></div>
                            <div><label class="text-xs font-bold text-gray-500 uppercase">Vehicle</label><p class="font-semibold text-gray-900">${state.vehicleInfo.year} ${state.vehicleInfo.make} ${state.vehicleInfo.model}</p></div>
                            <div><label class="text-xs font-bold text-gray-500 uppercase">VIN</label><p class="font-mono text-sm font-semibold text-gray-900">${state.vehicleInfo.vin || 'N/A'}</p></div>
                            <div><label class="text-xs font-bold text-gray-500 uppercase">Mileage</label><p class="font-semibold text-gray-900">${state.vehicleInfo.mileage || '---'}</p></div>
                            <div><label class="text-xs font-bold text-gray-500 uppercase">Inspector</label><p class="font-semibold text-gray-900">${state.vehicleInfo.technician || 'N/A'}</p></div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <!-- INTERACTIVE REPORT COLUMN (Screen Only) -->
                            <div class="col-span-2 no-print">
                                ${tabsHtml}
                                <div class="report-list space-y-3 animate-fade-in">
                                    ${listHtml}
                                </div>
                            </div>

                            <!-- PRINT ONLY SUMMARY COLUMN -->
                            <div class="col-span-2 print-only hidden">
                                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Issues Requiring Attention</h3>
                                ${printIssuesHtml}
                            </div>

                            <div class="bg-slate-50 p-6 rounded-xl border h-fit break-inside-avoid">
                                <h3 class="text-lg font-bold text-slate-800 mb-4">Estimate Summary</h3>
                                <div class="space-y-2 mb-4 pb-4 border-b border-gray-200">
                                    <div class="flex justify-between text-sm"><span class="text-gray-600">Parts & Labor</span><span class="font-medium">$${totalCost.toFixed(2)}</span></div>
                                    <div class="flex justify-between text-sm"><span class="text-gray-600">Shop Supplies (5%)</span><span class="font-medium">$${(totalCost * 0.05).toFixed(2)}</span></div>
                                    <div class="flex justify-between text-sm"><span class="text-gray-600">Tax (8%)</span><span class="font-medium">$${(totalCost * 0.08).toFixed(2)}</span></div>
                                </div>
                                <div class="flex justify-between items-end"><span class="font-bold text-xl text-gray-900">Total</span><span class="font-bold text-2xl text-blue-600">$${(totalCost * 1.13).toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div class="hidden print:block mt-8 pt-8 border-t-2 border-gray-300">
                            <h3 class="text-xl font-bold mb-4">Detailed Inspection Log</h3>
                            <div class="grid grid-cols-2 gap-4 text-xs">${detailLogHtml}</div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-6 border-t flex justify-between items-center print:hidden">
                        <button onclick="setView('inspection')" class="px-4 py-2 text-gray-600 font-medium hover:text-gray-900">Back to Inspection</button>
                        <div class="flex gap-3">
                            <button onclick="window.print()" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center gap-2 shadow-sm"><i data-lucide="printer" class="w-4 h-4"></i> Print / PDF</button>
                            <button onclick="resetInspection()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"><i data-lucide="check-circle-2" class="w-4 h-4"></i> Complete & New</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderMobileFooter() {
            const progress = getTotalProgress();
            return `
                <div class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t p-4 z-40 pb-8 no-print">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold text-gray-500 uppercase">Total Progress</span>
                        <span class="text-xs font-bold text-blue-600">${progress}%</span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-600 transition-all duration-500 ease-out" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }

        // --- Event Handlers ---

        function setReportTab(tab) {
            state.reportTab = tab;
            render();
        }

        function bindEvents() {
            document.querySelectorAll('.vehicle-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const field = e.target.dataset.field;
                    if(field) {
                        state.vehicleInfo[field] = e.target.value;
                        if (field === 'vin') state.vehicleInfo[field] = e.target.value.toUpperCase();
                        saveState();
                    }
                });
            });

            document.querySelectorAll('.item-note').forEach(input => {
                input.addEventListener('input', (e) => {
                    const cat = e.target.dataset.cat;
                    const id = e.target.dataset.item;
                    updateItemData(cat, id, { notes: e.target.value }, false);
                });
            });

             document.querySelectorAll('.item-cost').forEach(input => {
                input.addEventListener('input', (e) => {
                    const cat = e.target.dataset.cat;
                    const id = e.target.dataset.item;
                    updateItemData(cat, id, { cost: e.target.value }, false);
                });
            });
        }

        function handlePhotoUpload(e, itemId) {
            const file = e.target.files[0];
            if (!file) return;

            compressImage(file).then(base64 => {
                const catId = state.activeCategory;
                if (!state.inspectionData[catId]) state.inspectionData[catId] = {};
                if (!state.inspectionData[catId][itemId]) state.inspectionData[catId][itemId] = { status: null, notes: '', photos: [], cost: 0 };
                
                const itemData = state.inspectionData[catId][itemId];
                const currentPhotos = Array.isArray(itemData.photos) ? itemData.photos : [];
                
                if (currentPhotos.length < 5) {
                    const newPhotos = [...currentPhotos, base64];
                    updateItemData(catId, itemId, { photos: newPhotos }, true);
                }
            }).catch(err => {
                console.error("Image compression error", err);
                alert("Could not process image.");
            });
        }

        function deletePhoto(itemId, index) {
            const catId = state.activeCategory;
            const itemData = state.inspectionData[catId][itemId];
            if (!itemData || !Array.isArray(itemData.photos)) return;

            const newPhotos = [...itemData.photos];
            newPhotos.splice(index, 1);
            updateItemData(catId, itemId, { photos: newPhotos }, true);
        }

        function handleLogin(e) {
            e.preventDefault();
            const user = document.getElementById('auth-username').value;
            const pass = document.getElementById('auth-password').value;
            state.credentials = { username: user, password: pass };
            
            if (user === 'user' && pass === 'pass123') {
                state.isAuthenticated = true;
                state.authError = '';
                saveState();
                render();
            } else {
                state.authError = 'Invalid credentials. Try user / pass123';
                render();
            }
        }

        function setAuthMode(mode) {
            state.authMode = mode;
            state.authError = '';
            render();
        }

        function handleLogout() {
            state.isAuthenticated = false;
            localStorage.removeItem('mech_app_auth');
            state.credentials = { username: '', password: '' };
            render();
        }

        function startInspection() {
            state.currentView = 'inspection';
            state.activeCategory = INITIAL_CATEGORIES[0].id;
            render();
        }

        function setActiveCategory(id) {
            state.activeCategory = id;
            state.isSidebarOpen = false; // close on mobile selection
            render();
        }

        function toggleSidebar(isOpen) {
            state.isSidebarOpen = isOpen;
            render();
        }

        function setView(view) {
            state.currentView = view;
            render();
        }

        function navNext() {
            const idx = INITIAL_CATEGORIES.findIndex(c => c.id === state.activeCategory);
            if (idx < INITIAL_CATEGORIES.length - 1) {
                state.activeCategory = INITIAL_CATEGORIES[idx + 1].id;
                render();
            }
        }

        function navBack() {
            const idx = INITIAL_CATEGORIES.findIndex(c => c.id === state.activeCategory);
            if (idx > 0) {
                state.activeCategory = INITIAL_CATEGORIES[idx - 1].id;
                render();
            } else {
                state.currentView = 'intake';
                render();
            }
        }

        function updateItem(itemId, key, value) {
            updateItemData(state.activeCategory, itemId, { [key]: value }, true);
        }

        function updateItemData(catId, itemId, updates, shouldRender) {
            if (!state.inspectionData[catId]) state.inspectionData[catId] = {};
            if (!state.inspectionData[catId][itemId]) state.inspectionData[catId][itemId] = { status: null, notes: '', photos: [], cost: 0 };
            
            state.inspectionData[catId][itemId] = { ...state.inspectionData[catId][itemId], ...updates };
            saveState();
            if (shouldRender) render();
        }

        function resetInspection() {
            if (confirm("Start new inspection? This clears the current form data.")) {
                state.vehicleInfo = { ...INITIAL_VEHICLE_INFO };
                state.inspectionData = {};
                state.currentView = 'intake';
                state.activeCategory = INITIAL_CATEGORIES[0].id;
                saveState();
                render();
            }
        }

        // Start App
        init();
