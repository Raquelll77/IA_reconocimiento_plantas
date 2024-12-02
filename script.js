console.log(window.location.origin);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const message = document.getElementById("message");
  const speciesButton = document.getElementById("speciesButton");

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
      message.textContent =
        "Procesamiento exitoso. Consulta la consola para detalles.";
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
