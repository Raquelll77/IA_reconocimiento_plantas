console.log("Host: ", window.location.host);
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const message = document.getElementById("message");
  const speciesButton = document.getElementById("speciesButton");
  const resultCard = document.getElementById("resultCard");

  const videoStream = document.getElementById("videoStream");
  const captureCanvas = document.getElementById("captureCanvas");
  const captureButton = document.getElementById("captureButton");

  // Manejo del formulario para identificar plantas
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = imageInput.files[0];
    if (!file) {
      message.textContent = "Por favor, selecciona una imagen.";
      return;
    }

    try {
      // Mostrar el loading
      Swal.fire({
        title: "Procesando...",
        text: "Por favor espera mientras identificamos la planta.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(); // Activar loading
        },
      });

      const response = await identificarPlanta(file);

      console.log("Resultados de la identificación:", response);

      // Generar la tarjeta y esperar a que esté completamente renderizada
      await renderResultCard(response);

      // Esperar a que la imagen cargue antes de cerrar el loading
      const plantImage = document.querySelector(".plant-image");
      if (plantImage) {
        await waitForImageToLoad(plantImage);
      }

      Swal.close(); // Cerrar el loading

      // Mostrar alerta de éxito
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La planta fue identificada correctamente. Consulta la tarjeta para más detalles.",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo identificar la planta. Inténtalo nuevamente.",
      });
      console.error("Error:", error);
      message.textContent = "Error al procesar la imagen: " + error.message;
    }
  });

  // Manejo del botón para listar especies //original
//   speciesButton.addEventListener("click", async () => {
//     try {
//       const response = await listarEspecies();
//       console.log("Especies disponibles:", response);
//       message.textContent =
//         "Consulta de especies exitosa. Revisa la consola para detalles.";
//     } catch (error) {
//       console.error("Error al listar especies:", error);
//       message.textContent = "Error al listar las especies: " + error.message;
//     }
//   });
speciesButton.addEventListener("click", async () => {
  try {
    // Redirigir directamente a la página sin pasar los datos en la URL
    window.location.href = "especies.html";
  } catch (error) {
    console.error("Error al redirigir:", error);
    message.textContent = "Error al redirigir: " + error.message;
  }
});



 });


// Captura en tiempo real desde la cámara
async function startVideoStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    videoStream.srcObject = stream;
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
  }
}

captureButton.addEventListener("click", () => {
  const context = captureCanvas.getContext("2d");
  captureCanvas.width = videoStream.videoWidth;
  captureCanvas.height = videoStream.videoHeight;

  context.drawImage(
    videoStream,
    0,
    0,
    captureCanvas.width,
    captureCanvas.height
  );

  captureCanvas.toBlob(async (blob) => {
    try {
      Swal.fire({
        title: "Procesando...",
        text: "Por favor espera mientras identificamos la planta.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await identificarPlanta(blob);
      console.log("Resultados de la identificación:", response);

      await renderResultCard(response);
      Swal.close();

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La planta fue identificada correctamente.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo identificar la planta.",
      });
      console.error("Error:", error);
    }
  }, "image/jpeg");
});

// Iniciar la transmisión en vivo al cargar la página
startVideoStream();

// Función para identificar plantas
async function identificarPlanta(imagen) {
  const apiKey = "2b10MBQdgypiItEYRRaFJu";
  const project = "all";
  const lang = "es"; // Idioma de los resultados
  const includeRelatedImages = "false"; // Opcional: incluir imágenes relacionadas
  const noReject = "false"; // Opcional: no rechazar coincidencias
  const nbResults = "5"; // Número máximo de resultados

  const url = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}&lang=${lang}&include-related-images=${includeRelatedImages}&no-reject=${noReject}&nb-results=${nbResults}`;

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

    return response.json();
  } catch (error) {
    console.error("Error al identificar la planta:", error);
    throw error;
  }
}

// Función para esperar a que una imagen cargue
function waitForImageToLoad(image) {
  return new Promise((resolve, reject) => {
    if (image.complete) {
      resolve(); // Imagen ya cargada
    } else {
      image.addEventListener("load", resolve); // Esperar a que cargue
      image.addEventListener("error", reject); // Manejar errores
    }
  });
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

  const images = await fetchImagesFromGBIF(scientificName);
  const imageUrl =
    images[0] || "https://via.placeholder.com/300?text=Sin+Imagen";

  const cardHTML = `
    <div class="card">
      <img src="${imageUrl}" alt="${commonName}" class="plant-image" />
      <h2>${commonName}</h2>
      <p><strong>Nombre científico:</strong> ${scientificName}</p>
      <p><strong>Familia:</strong> ${family}</p>
      <p><strong>Precisión:</strong> ${score}</p>
      <div class="iucn">Conservación: ${conservationStatus}</div>
      <!-- Botón de información -->
      <i id="moreInfoIcon" class="fas fa-info-circle more-info-icon" 
         style="font-size: 1.5rem; cursor: pointer;"
         title="Más información"></i>
    </div>
  `;

  document.getElementById("resultCard").innerHTML = cardHTML;

   // Evento para abrir el modal al hacer clic en el ícono
  document
    .getElementById("moreInfoIcon")
    .addEventListener("click", () => fetchGBIFInfoWithDescription(scientificName));
}

//------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const openCameraButton = document.getElementById("openCameraButton");
  const switchCameraButton = document.getElementById("switchCameraButton");
  const cameraContainer = document.getElementById("cameraContainer");
  const videoStream = document.getElementById("videoStream");
  let currentStream = null;
  let currentDeviceIndex = 0;
  let videoDevices = [];

  const stopStream = () => {
    if (currentStream) {
      const tracks = currentStream.getTracks();
      tracks.forEach((track) => track.stop());
      currentStream = null;
    }
  };

  const startVideoStream = async (deviceId) => {
    try {
      stopStream();
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStream.srcObject = currentStream;
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo acceder a la cámara.",
      });
    }
  };

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter((device) => device.kind === "videoinput");
      console.log("Cámaras disponibles:", videoDevices);
    } catch (error) {
      console.error("Error al obtener las cámaras:", error);
    }
  };

  openCameraButton.addEventListener("click", async () => {
    if (cameraContainer.style.display === "none") {
      cameraContainer.style.display = "block";
      await getVideoDevices();
      if (videoDevices.length > 0) {
        startVideoStream(videoDevices[currentDeviceIndex]?.deviceId);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se encontraron cámaras disponibles.",
        });
      }
    } else {
      cameraContainer.style.display = "none";
      stopStream();
    }
  });

  switchCameraButton.addEventListener("click", async () => {
    if (videoDevices.length > 1) {
      currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
      startVideoStream(videoDevices[currentDeviceIndex]?.deviceId);
    } else {
      Swal.fire({
        icon: "info",
        title: "Cámara única",
        text: "No hay cámaras adicionales para alternar.",
      });
    }
  });
});

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

// Función para obtener información detallada desde la API de GBIF
async function fetchGBIFInfoWithDescription(scientificName) {
  const gbifUrl = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&limit=1`;

  try {
    const response = await fetch(gbifUrl);

    if (!response.ok) {
      throw new Error("Error al buscar información en GBIF: " + response.statusText);
    }

    const data = await response.json();
    console.log("Datos obtenidos de GBIF:", data);

    // Verificar si hay resultados
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];

      // Obtener la información detallada de la planta desde GBIF
      const gbifData = {
        species: firstResult.species || "No disponible",
        family: firstResult.family || "No disponible",
        genus: firstResult.genus || "No disponible",
        country: firstResult.country || "No disponible",
        decimalLatitude: firstResult.decimalLatitude || "No disponible",
        decimalLongitude: firstResult.decimalLongitude || "No disponible",
        occurrenceDate: firstResult.eventDate || "No disponible",
        record: firstResult.occurrenceID || "No disponible",
      };

      console.log("Información detallada de la planta desde GBIF:", gbifData);

      // Obtener la descripción de Wikipedia usando el nombre científico
      const wikipediaData = await fetchWikipediaDescription(firstResult.species);

      // Mostrar la información de la planta en un modal
      Swal.fire({
        title: `Información sobre ${firstResult.species || 'planta desconocida'}`,
        html: `
          <p><strong>Género:</strong> ${gbifData.genus}</p>
          <p><strong>Familia:</strong> ${gbifData.family}</p>
          <p><strong>País:</strong> ${gbifData.country}</p>
          <p><strong>Fecha de ocurrencia:</strong> ${gbifData.occurrenceDate}</p>
          <p><strong>Ubicación:</strong> Lat: ${gbifData.decimalLatitude}, Long: ${gbifData.decimalLongitude}</p>
          <p><strong>ID de registro:</strong> ${gbifData.record}</p>
          <p><strong>Descripción:</strong> ${wikipediaData.extract || "No hay descripción disponible."}</p>
          <p><strong>Título de Wikipedia:</strong> <a href="${wikipediaData.url}" target="_blank">${wikipediaData.title}</a></p>
          <p><strong>Más información:</strong> <a href="${wikipediaData.url}" target="_blank">Ver página completa en Wikipedia</a></p>
        `,
        icon: 'info',
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "Sin resultados",
        text: `No se encontraron resultados para ${scientificName} en GBIF.`,
      });
    }
  } catch (error) {
    console.error("Error al obtener información de GBIF:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo obtener información de GBIF para "${scientificName}".`,
    });
  }
}

// Función para obtener más información desde Wikipedia en español
async function fetchWikipediaDescription(scientificName) {
  const formattedName = encodeURIComponent(scientificName);
  const searchUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${formattedName}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`No se pudo obtener descripción de Wikipedia para: ${scientificName}`);
    }

    const data = await response.json();
    console.log("Descripción de Wikipedia:", data);

    return {
      extract: data.extract || null,          // Descripción breve
      title: data.title || "No disponible",   // Título de la página
      url: data.content_urls?.desktop?.page || "No disponible", // URL de la página
    };
  } catch (error) {
    console.error("Error al obtener la descripción de Wikipedia:", error);
    return { extract: null, title: "No disponible", url: "No disponible" };
  }
}
