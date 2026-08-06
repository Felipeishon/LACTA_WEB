export function showToast(message, type = 'info') {
    // Check if container exists, otherwise create it
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    // Base styles
    let baseClass = 'px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2';
    
    // Type specific styles
    if (type === 'error') {
        toast.className = baseClass + ' bg-red-500';
        toast.innerHTML = `<span>❌</span> ${message}`;
    } else if (type === 'success') {
        toast.className = baseClass + ' bg-green-500';
        toast.innerHTML = `<span>✅</span> ${message}`;
    } else {
        toast.className = baseClass + ' bg-blue-500';
        toast.innerHTML = `<span>ℹ️</span> ${message}`;
    }

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
