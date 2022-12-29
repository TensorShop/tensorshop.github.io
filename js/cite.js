function copyCitation(button) {
	navigator.clipboard.writeText(button.parentElement.children[0].innerText);
	button.classList.remove('fa-copy')
	button.classList.add('fa-check')
	setTimeout(() => {
		button.classList.add('fa-copy')
		button.classList.remove('fa-check')
	},1000);
}
