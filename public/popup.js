document.addEventListener("DOMContentLoaded", function () {
  const logo = document.getElementById("logo");
  const licenceInput = document.getElementById("licenceInput");
  const dropZone = document.getElementById("drop_zone"); // Assurez-vous que dropZone est défini ici
  const fileInput = document.getElementById("fileInput");
  const fileUrl = document.getElementById("fileUrl");
  const uploadButton = document.getElementById("uploadButton");
  const fillButton = document.getElementById("fillButton");

  // Définition de la fonction disableInteraction
  function disableInteraction() {
    uploadButton.disabled = true;
    fillButton.disabled = true;
    fileInput.disabled = true;
    fileUrl.disabled = true;
    dropZone.classList.add("disabled");
  }

  // Définition de la fonction enableInteraction
  function enableInteraction() {
    uploadButton.disabled = false;
    fillButton.disabled = false;
    fileInput.disabled = false;
    fileUrl.disabled = false;
    dropZone.classList.remove("disabled");
  }

  // Désactivez tous les boutons et la drop zone au début
  disableInteraction();

  if (logo && licenceInput) {
    let clickCount = 0;

    logo.addEventListener("click", function () {
      clickCount++;
      console.log("Nombre de clics enregistrés: " + clickCount);
      if (clickCount === 3) {
        showLicenceInput();
        clickCount = 0; // reset click count
      }
    });

    licenceInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        checkLicenceKey(licenceInput.value);
      } else if (event.key === "Escape") {
        hideLicenceInput();
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target !== licenceInput && event.target !== logo) {
        hideLicenceInput();
      }
    });

    function showLicenceInput() {
      logo.style.display = "none";
      licenceInput.style.display = "block";
      licenceInput.focus();
    }

    function hideLicenceInput() {
      logo.style.display = "block";
      licenceInput.style.display = "none";
      licenceInput.value = "";
    }

    function checkLicenceKey(key) {
      // Replace 'VALID_KEY' with the actual key you want to check
      const VALID_KEY = "a";
      if (key === VALID_KEY) {
        alert("Clé de licence valide!");
        hideLicenceInput();
        enableInteraction(); // Active les interactions si la clé est valide
      } else {
        alert("Clé de licence invalide. Veuillez réessayer.");
        licenceInput.value = "";
        disableInteraction(); // Désactive les interactions si la clé est invalide
      }
    }
  } else {
    console.error(
      "L'élément logo ou licenceInput est introuvable dans le DOM.",
    );
  }
});

// Autres fonctions existantes

document.getElementById("fillButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: autoFill,
    });
  });
});

document.getElementById("drop_zone").addEventListener("dragover", (event) => {
  const dropZone = document.getElementById("drop_zone");
  if (!dropZone.classList.contains("disabled")) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }
});

document.getElementById("drop_zone").addEventListener("drop", (event) => {
  const dropZone = document.getElementById("drop_zone");
  if (!dropZone.classList.contains("disabled")) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }
});

document.getElementById("drop_zone").addEventListener("click", () => {
  const dropZone = document.getElementById("drop_zone");
  if (!dropZone.classList.contains("disabled")) {
    document.getElementById("fileInput").click();
  }
});

document.getElementById("fileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
});

document.getElementById("fileUrl").addEventListener("input", (event) => {
  const url = event.target.value;
  const regex = /^https:\/\/2607377\.cdnp1\.hubspotusercontent-eu1\.net\//;
  if (regex.test(url)) {
    uploadButton.classList.add("highlight");
    uploadButton.classList.add("animate");
    uploadButton.disabled = false;
  } else {
    uploadButton.classList.remove("highlight");
    uploadButton.classList.remove("animate");
    uploadButton.disabled = true;
  }
});

document.getElementById("fileUrl").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Empêche le comportement par défaut de la touche Entrée
    showEnterFeedback(); // Affiche le feedback visuel
    fetchFileFromUrl(); // Lance l'analyse
  }
});

document.getElementById("uploadButton").addEventListener("click", () => {
  fetchFileFromUrl();
});

function fetchFileFromUrl() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length > 0) {
    handleFile(fileInput.files[0]);
  } else {
    const url = document.getElementById("fileUrl").value;
    if (url) {
      fetchFile(url);
    } else {
      alert("Veuillez sélectionner un fichier ou entrer un lien.");
    }
  }
}

function handleFile(file) {
  console.log("Handling file:", file);
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = event.target.result;
    console.log("File read successfully:", file.name);
    sendFileToProxy(file.name, data, file.type);
    document.getElementById("drop_zone").textContent =
      `Fichier chargé: ${file.name}`;
  };

  reader.onerror = function (event) {
    console.error("File reading failed:", event);
  };

  reader.readAsArrayBuffer(file);
}

function fetchFile(url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.arrayBuffer();
    })
    .then((data) => {
      const fileName = url.split("/").pop();
      sendFileToProxy(fileName, data, "application/octet-stream"); // Default MIME type
      document.getElementById("drop_zone").textContent =
        `Fichier chargé: ${fileName}`;
    })
    .catch((error) => {
      console.error("Error fetching file:", error);
      displayError("Error fetching file: " + error.message);
    });
}

function sendFileToProxy(fileName, data, mimeType) {
  console.log("Sending file to proxy:", fileName);

  const formData = new FormData();
  formData.append("file", new Blob([data], { type: mimeType }), fileName);
  formData.append("purpose", "assistants"); // Assurez-vous que cette valeur est correcte

  showLoader(); // Show loader when starting the upload

  fetch(
    "https://bb37c986-cc89-4095-a778-bb9d6fa7757d-00-1h7tjgnpzenrh.janeway.replit.dev/upload",
    {
      method: "POST",
      body: formData,
    },
  )
    .then((response) => {
      console.log("Upload response:", response);
      if (!response.ok) {
        throw new Error(`File upload failed: ${response.statusText}`);
      }
      return response.json();
    })
    .then((result) => {
      console.log("File uploaded:", result);
      hideLoader(); // Hide loader when upload is complete
      displayModal(`File uploaded successfully: ${result.id}`);
    })
    .catch((error) => {
      console.error("Error uploading file:", error);
      displayError(`Error uploading file: ${error.message}`);
      hideLoader(); // Hide loader in case of error
    });
}

function showLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
}

function displayError(message) {
  const errorElement = document.getElementById("error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function displayModal(message) {
  const modal = document.getElementById("myModal");
  const modalText = document.getElementById("modalText");
  modalText.textContent = message;
  modal.style.display = "block";
}

function showEnterFeedback() {
  const fileUrlInput = document.getElementById("fileUrl");
  const originalBorderColor = fileUrlInput.style.borderColor;

  fileUrlInput.style.borderColor = "green";
  setTimeout(() => {
    fileUrlInput.style.borderColor = originalBorderColor;
  }, 500);
}

function autoFill() {
  console.log("AutoFill script running...");

  // Vérifier si l'URL actuelle commence par 'https://dashboard.garantme.fr/'
  if (window.location.href.startsWith("https://dashboard.garantme.fr/")) {
    console.log("URL correspond à 'https://dashboard.garantme.fr/'");

    // Sélectionner l'élément par son nom
    var rentInput = document.querySelector('[name="pricingMonthlyRent"]');

    // Remplir le champ avec une valeur de test
    if (rentInput) {
      rentInput.value = "610"; // valeur de test
      console.log("Pricing Monthly Rent input filled with value: 610");
    } else {
      console.log("Pricing Monthly Rent input not found");
    }
  } else {
    console.log(
      "URL ne correspond pas à 'https://dashboard.garantme.fr/', script non exécuté",
    );
  }
}

// Ajouter un écouteur d'événements au bouton fillButton pour appeler autoFill lorsqu'il est cliqué
document.addEventListener("DOMContentLoaded", (event) => {
  var fillButton = document.getElementById("fillButton");
  if (fillButton) {
    fillButton.addEventListener("click", autoFill);
    console.log("Event listener added to fillButton");
  } else {
    console.log("fillButton not found");
  }
});

// Appeler la fonction autoFill lorsque la page est chargée
window.onload = autoFill;

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("myModal").style.display = "none";
});

window.addEventListener("click", (event) => {
  const modal = document.getElementById("myModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
});
