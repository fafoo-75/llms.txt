const form = document.getElementById('generatorForm');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const result = document.getElementById('result');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const content = document.getElementById('content');
const pagesList = document.getElementById('pagesList');
const pagesCount = document.getElementById('pagesCount');

let generatedContent = '';

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        url: document.getElementById('url').value,
        title: document.getElementById('title').value,
        summary: document.getElementById('summary').value,
        language: document.getElementById('language').value,
        maxPages: parseInt(document.getElementById('maxPages').value),
        maxDepth: parseInt(document.getElementById('maxDepth').value),
        includeMarkdownVersions: false,
    };

    loading.classList.remove('hidden');
    error.classList.add('hidden');
    result.classList.add('hidden');
    generateBtn.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la génération');
        }

        generatedContent = data.content;
        content.textContent = generatedContent;
        pagesCount.textContent = `${data.pagesFound} page${data.pagesFound > 1 ? 's' : ''} trouvée${data.pagesFound > 1 ? 's' : ''}`;

        pagesList.innerHTML = '';
        data.pages.forEach(page => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${page.title}</strong><br><small>${page.url}</small>`;
            pagesList.appendChild(li);
        });

        result.classList.remove('hidden');
    } catch (err) {
        error.textContent = `❌ ${err.message}`;
        error.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(generatedContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copié !';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        alert('Erreur lors de la copie');
    }
});
