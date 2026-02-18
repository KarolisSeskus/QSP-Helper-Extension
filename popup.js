function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0]);
    });
  });
}

document.getElementById("apply").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const input = document.getElementById("params-to-add").value;

  const url = new URL(tab.url);
  const newParams = new URLSearchParams(input);

  for (const [key, value] of newParams.entries()) {
    url.searchParams.set(key, value);
  }

  chrome.tabs.update(tab.id, { url: url.toString() });
});

document.getElementById("save").addEventListener("click", () => {
  const value = document.getElementById("params-to-add").value.trim();
  if (!value) return;

  const name = prompt("Preset name?");
  if (!name) return;

  chrome.storage.local.get({ presets: [] }, data => {
    const presets = [
      ...data.presets,
      {
        id: Date.now().toString(),
        name,
        value
      }
    ];

    chrome.storage.local.set({ presets }, renderPresets);
  });
});

document.getElementById("clear").addEventListener("click", async () => {
  document.getElementById("params-to-add").value = "";
});

document.getElementById("get").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const url = new URL(tab.url);
  const params = Array.from(url.searchParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  document.getElementById("params-to-add").value = params;
});

function renderPresets() {
  chrome.storage.local.get({ presets: [] }, data => {
    const savePresetsElement = document.getElementById("preset-container");
    
    if (data.presets.length === 0) {
      savePresetsElement.classList.add("hide");
      return;
    } else if (savePresetsElement.classList.contains("hide")) {
      savePresetsElement.classList.remove("hide");
    }

    const list = document.getElementById("preset-list");
    list.innerHTML = "";

    data.presets.forEach(preset => {
      const listItem = document.createElement("li");
      listItem.style.overflowWrap = "break-word";

      const label = document.createElement("span");
      label.classList.add("presetLabel");
      label.textContent = preset.name;

      label.addEventListener("click", () => {
        document.getElementById("params-to-add").value = preset.value;
      });

      const removeButton = document.createElement("button");
      removeButton.textContent = "✕";
      removeButton.classList.add("remove");

      removeButton.addEventListener("click", () => {
        deletePreset(preset.id);
      });

      listItem.appendChild(label);
      listItem.appendChild(removeButton);
      list.appendChild(listItem);
    });
  });
}

function deletePreset(id) {
  chrome.storage.local.get({ presets: [] }, data => {
    const presets = data.presets.filter(p => p.id !== id);
    chrome.storage.local.set({ presets }, renderPresets);
  });
}

renderPresets();