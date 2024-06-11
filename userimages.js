const form = document.getElementById('imageForm');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(form);

    try {
        const response = await fetch('url_del_servidor', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Hi ha hagut un problema en enviar les imatges.');
        }

        alert('Les imatges s\'han enviat correctament.');
        form.reset(); // Reinicia el formulari després de l'enviament
    } catch (error) {
        console.error('Error:', error.message);
        alert('Hi ha hagut un error en enviar les imatges. Si us plau, intenta-ho de nou més tard.');
    }
});