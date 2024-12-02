console.log(window.location.origin);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const message = document.getElementById("message");
  const speciesButton = document.getElementById("speciesButton");
  const resultCard = document.getElementById("resultCard");

  // Manejo del formulario para identificar plantas
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = imageInput.files[0];
    if (!file) {
      message.textContent = "Por favor, selecciona una imagen.";
      return;
    }

    try {
      const response = await identificarPlanta(file);
      console.log("Resultados de la identificación:", response);
      renderResultCard(response); // Generar la tarjeta con los resultados
      message.textContent =
        "Procesamiento exitoso. Consulta la tarjeta para detalles.";
    } catch (error) {
      console.error("Error:", error);
      message.textContent = "Error al procesar la imagen: " + error.message;
    }
  });

  // Manejo del botón para listar especies
  speciesButton.addEventListener("click", async () => {
    try {
      const response = await listarEspecies();
      console.log("Especies disponibles:", response);
      message.textContent =
        "Consulta de especies exitosa. Revisa la consola para detalles.";
    } catch (error) {
      console.error("Error al listar especies:", error);
      message.textContent = "Error al listar las especies: " + error.message;
    }
  });
});

// Función para identificar plantas
async function identificarPlanta(imagen) {
  const apiKey = "2b10MBQdgypiItEYRRaFJu";
  const project = "all";
  const lang = "es"; // Idioma de los resultados
  const includeRelatedImages = "false"; // Opcional: incluir imágenes relacionadas
  const noReject = "false"; // Opcional: no rechazar coincidencias
  const nbResults = "5"; // Número máximo de resultados

  // Construir la URL con parámetros
  const url = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}&lang=${lang}&include-related-images=${includeRelatedImages}&no-reject=${noReject}&nb-results=${nbResults}`;

  // Crear el cuerpo de la solicitud (FormData)
  const formData = new FormData();
  formData.append("images", imagen); // Archivo de imagen
  formData.append("organs", "leaf"); // Relacionado con el archivo (ejemplo: "leaf")

  console.log("FormData enviado:", Object.fromEntries(formData.entries()));

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error en la solicitud: ${response.status} - ${
          response.statusText
        }. Detalles: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    console.log("Resultados de la identificación:", data);
    return data;
  } catch (error) {
    console.error("Error al identificar la planta:", error);
    throw error;
  }
}

// Función para listar especies
async function listarEspecies() {
  const apiKey = "2b10MBQdgypiItEYRRaFJu"; // Reemplaza con tu clave API
  const url = `https://my-api.plantnet.org/v2/species?lang=es&type=kt&api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error en la solicitud: " + response.statusText);
  }

  return response.json();
}

// Función para buscar imágenes en GBIF
async function fetchImagesFromGBIF(scientificName) {
  const gbifUrl = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(
    scientificName
  )}&mediaType=StillImage`;

  try {
    const response = await fetch(gbifUrl);

    if (!response.ok) {
      throw new Error(
        "Error al buscar imágenes en GBIF: " + response.statusText
      );
    }

    const data = await response.json();

    // Extraer las primeras imágenes encontradas
    const images = data.results
      .flatMap((result) => result.media || [])
      .map((media) => media.identifier);

    console.log("Imágenes encontradas en GBIF:", images);
    return images; // Devuelve un array con las URLs de las imágenes
  } catch (error) {
    console.error("Error al obtener imágenes de GBIF:", error);
    return [];
  }
}

// Función para generar la tarjeta con la imagen desde GBIF
async function renderResultCard(data) {
  const result = data.results[0];
  const commonName = result.species.commonNames[0] || "No disponible";
  const scientificName = result.species.scientificName || "No disponible";
  const family = result.species.family.scientificName || "No disponible";
  const conservationStatus =
    result.iucn?.category === "LC"
      ? "Preocupación Menor"
      : result.iucn?.category || "No disponible";
  const score = (result.score * 100).toFixed(2) + "%";

  // Buscar imágenes en GBIF
  const images = await fetchImagesFromGBIF(scientificName);
  const imageUrl =
    images[0] || "https://via.placeholder.com/300?text=Sin+Imagen";

  // Generar el HTML de la tarjeta
  const cardHTML = `
    <div class="card">
      <img src="${imageUrl}" alt="${commonName}" class="plant-image" />
      <h2>${commonName}</h2>
      <p><strong>Nombre científico:</strong> ${scientificName}</p>
      <p><strong>Familia:</strong> ${family}</p>
      <p><strong>Precisión:</strong> ${score}</p>
      <div class="iucn">Conservación: ${conservationStatus}</div>
    </div>
  `;

  // Insertar el HTML en el contenedor
  document.getElementById("resultCard").innerHTML = cardHTML;
}
