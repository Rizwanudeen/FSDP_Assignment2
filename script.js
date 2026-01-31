// Small utility helpers used across the UI
function escapeHtml(unsafe) {
	if (!unsafe && unsafe !== '') return '';
	return String(unsafe)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// Close modals with Escape and allow clicking overlay to close
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		const activeModal = document.querySelector('.modal.active');
		if (activeModal) activeModal.classList.remove('active');
	}
});

document.addEventListener('click', (e) => {
	const modal = e.target.closest('.modal');
	if (modal && modal.classList.contains('active')) {
		// if clicked directly on overlay (modal), close
		if (e.target === modal) modal.classList.remove('active');
	}
});

// Expose helpers for app (used in templates)
window.escapeHtml = escapeHtml;
