// Cargar jsyaml desde CDN
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
document.head.appendChild(script);

// Variables globales
let currentContentType = 'swagger'; // 'swagger' o 'json'
let currentJsonData = null;

// Esperar a que jsyaml se cargue
script.onload = function() {
  initializeApp();
};

function initializeApp() {
  // Event listener para el botón de renderizar
  document.getElementById('render-btn').addEventListener('click', function() {
    const yamlText = document.getElementById('swagger-yaml').value;
    
    if (currentContentType === 'json') {
      showJsonViewer(yamlText);
    } else {
      showSwaggerUI(yamlText);
    }
  });

  // Event listener para el selector de ejemplos
  document.getElementById('example-select').addEventListener('change', function() {
    const selectedFile = this.value;
    if (selectedFile) {
      loadExampleFile(selectedFile);
      // Limpiar el selector de catálogos
      document.getElementById('catalogo-select').value = '';
      currentContentType = 'swagger';
    }
  });

  // Event listener para el selector de catálogos
  document.getElementById('catalogo-select').addEventListener('change', function() {
    const selectedFile = this.value;
    if (selectedFile) {
      loadCatalogoFile(selectedFile);
      // Limpiar el selector de ejemplos
      document.getElementById('example-select').value = '';
      currentContentType = 'json';
    }
  });
}

function showSwaggerUI(yamlText) {
  let spec;
  try {
    // Intenta parsear como JSON
    spec = JSON.parse(yamlText);
  } catch (e) {
    try {
      // Si falla, intenta como YAML
      spec = jsyaml.load(yamlText);
    } catch (err) {
      alert('El texto no es un YAML o JSON válido.');
      return;
    }
  }
  
  // Mostrar Swagger UI
  document.getElementById('swagger-ui').style.display = 'block';
  document.getElementById('json-viewer').style.display = 'none';
  
  window.ui = SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "BaseLayout",
    docExpansion: "none",
    deepLinking: true
  });
}

function showJsonViewer(jsonText) {
  try {
    const jsonObj = JSON.parse(jsonText);
    currentJsonData = jsonObj;
    
    // Mostrar JSON Viewer
    document.getElementById('swagger-ui').style.display = 'none';
    document.getElementById('json-viewer').style.display = 'block';
    
    // Renderizar JSON
    const jsonContent = document.getElementById('json-content');
    jsonContent.innerHTML = renderJson(jsonObj);
  } catch (err) {
    alert('El texto no es un JSON válido.');
  }
}

function renderJson(obj, level = 0) {
  const indent = '  '.repeat(level);
  let html = '';
  
  if (obj === null) {
    return '<span class="json-null">null</span>';
  }
  
  if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  }
  
  if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  }
  
  if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '<span class="json-string">[]</span>';
    }
    
    html = '<span class="json-toggle" onclick="toggleJson(this)">[</span>';
    html += '<div class="json-collapsible" style="display: block;">';
    
    obj.forEach((item, index) => {
      html += `<div style="margin-left: 20px;">`;
      html += renderJson(item, level + 1);
      if (index < obj.length - 1) html += ',';
      html += '</div>';
    });
    
    html += '</div>';
    html += '<span class="json-toggle" onclick="toggleJson(this)">]</span>';
    return html;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-string">{}</span>';
    }
    
    html = '<span class="json-toggle" onclick="toggleJson(this)">{</span>';
    html += '<div class="json-collapsible" style="display: block;">';
    
    keys.forEach((key, index) => {
      html += `<div style="margin-left: 20px;">`;
      html += `<span class="json-key">"${escapeHtml(key)}"</span>: `;
      html += renderJson(obj[key], level + 1);
      if (index < keys.length - 1) html += ',';
      html += '</div>';
    });
    
    html += '</div>';
    html += '<span class="json-toggle" onclick="toggleJson(this)">}</span>';
    return html;
  }
  
  return String(obj);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleJson(element) {
  const collapsible = element.nextElementSibling;
  if (collapsible && collapsible.classList.contains('json-collapsible')) {
    if (collapsible.style.display === 'none') {
      collapsible.style.display = 'block';
    } else {
      collapsible.style.display = 'none';
    }
  }
}

function loadExampleFile(filename) {
  fetch(`ejemplos/${filename}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(content => {
      document.getElementById('swagger-yaml').value = content;
      currentContentType = 'swagger';
    })
    .catch(error => {
      console.error('Error cargando el archivo:', error);
      alert(`Error al cargar el archivo: ${error.message}`);
    });
}

function loadCatalogoFile(filename) {
  fetch(`catalogos/${filename}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(content => {
      // Formatear JSON para mejor visualización
      try {
        const jsonObj = JSON.parse(content);
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        document.getElementById('swagger-yaml').value = formattedJson;
        currentContentType = 'json';
      } catch (e) {
        // Si no es JSON válido, mostrar como texto plano
        document.getElementById('swagger-yaml').value = content;
        currentContentType = 'swagger';
      }
    })
    .catch(error => {
      console.error('Error cargando el catálogo:', error);
      alert(`Error al cargar el catálogo: ${error.message}`);
    });
}

// Función para agregar más ejemplos dinámicamente
function addExampleOption(filename, displayName) {
  const select = document.getElementById('example-select');
  const option = document.createElement('option');
  option.value = filename;
  option.textContent = displayName;
  select.appendChild(option);
}

// Función para agregar más catálogos dinámicamente
function addCatalogoOption(filename, displayName) {
  const select = document.getElementById('catalogo-select');
  const option = document.createElement('option');
  option.value = filename;
  option.textContent = displayName;
  select.appendChild(option);
}

// Cargar YAML por defecto si lo deseas
// document.getElementById('swagger-yaml').value = 'openapi: 3.0.3\ninfo:\n  title: Ejemplo...'; 