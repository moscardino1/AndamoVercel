document.addEventListener('DOMContentLoaded', function() {
    // Style the select dropdowns
    const selects = document.querySelectorAll('.filters select');
    
    selects.forEach(select => {
        // Add event listener for when the dropdown is opened
        select.addEventListener('mousedown', function(e) {
            if(window.innerWidth >= 640) {
                e.preventDefault();
                
                const options = Array.from(this.options);
                const optionHeight = 40; // Height of each option in pixels
                
                // Create custom dropdown
                const dropdown = document.createElement('div');
                dropdown.classList.add('custom-select-dropdown');
                dropdown.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #1a1a1a;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    margin-top: 4px;
                    max-height: ${Math.min(options.length * optionHeight, 300)}px;
                    overflow-y: auto;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                `;
                
                options.forEach(option => {
                    const optionEl = document.createElement('div');
                    optionEl.classList.add('custom-select-option');
                    optionEl.textContent = option.text;
                    optionEl.style.cssText = `
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `;
                    
                    if(option.selected) {
                        optionEl.style.backgroundColor = 'rgba(255, 51, 102, 0.2)';
                    }
                    
                    optionEl.addEventListener('mouseover', () => {
                        optionEl.style.backgroundColor = 'rgba(255, 51, 102, 0.1)';
                    });
                    
                    optionEl.addEventListener('mouseout', () => {
                        if(!option.selected) {
                            optionEl.style.backgroundColor = 'transparent';
                        }
                    });
                    
                    optionEl.addEventListener('click', () => {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change'));
                        document.body.removeChild(dropdown);
                    });
                    
                    dropdown.appendChild(optionEl);
                });
                
                // Position and show dropdown
                document.body.appendChild(dropdown);
                dropdown.style.left = `${select.getBoundingClientRect().left}px`;
                dropdown.style.top = `${select.getBoundingClientRect().bottom}px`;
                dropdown.style.width = `${select.offsetWidth}px`;
                
                // Close dropdown when clicking outside
                const closeDropdown = (e) => {
                    if(!dropdown.contains(e.target) && e.target !== select) {
                        document.body.removeChild(dropdown);
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                
                // Small delay to prevent immediate closing
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 0);
            }
        });
    });
});