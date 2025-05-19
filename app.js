tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
};
tailwind.config.plugins = [];
tailwind.config.content = ["./**/*.{html,js}"];

// Geliştirilmiş koyu mod yönetimi
const darkModeToggle = document.getElementById("darkModeToggle");
const html = document.documentElement;
const darkIcon = darkModeToggle.querySelector(".fa-moon");
const lightIcon = darkModeToggle.querySelector(".fa-sun");

// Tema tercihlerini yönetmek için yardımcı fonksiyonlar
const themeConfig = {
  getSystemPreference: () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  },

  setTheme: (isDark) => {
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#1f2937"); // dark mode rengi
    } else {
      html.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#ffffff"); // light mode rengi
    }

    // Renk geçişi için sınıf ekle
    document.body.classList.add("theme-transition");
    setTimeout(() => {
      document.body.classList.remove("theme-transition");
    }, 300);
  },

  initTheme: () => {
    // Önceki tercih varsa onu kullan, yoksa sistem tercihini kullan
    const storedDarkMode = localStorage.getItem("darkMode");
    const systemPreference = themeConfig.getSystemPreference();

    if (storedDarkMode === null) {
      themeConfig.setTheme(systemPreference);
    } else {
      themeConfig.setTheme(storedDarkMode === "true");
    }
  },

  toggleTheme: () => {
    const isDarkMode = html.classList.contains("dark");
    themeConfig.setTheme(!isDarkMode);
  },
};

// Sistem tercihi değişirse dinle
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    // Kullanıcı manuel tercih yapmadıysa sistem tercihini takip et
    if (localStorage.getItem("darkMode") === null) {
      themeConfig.setTheme(e.matches);
    }
  });

// Temayı başlat
themeConfig.initTheme();

// Tema değiştirme düğmesi için olay dinleyicisi
darkModeToggle.addEventListener("click", themeConfig.toggleTheme);

// Görev yönetimi
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let showCompletedTasks = false;
let currentFocusTask = null;

// Pomodoro Zamanlayıcısı
const pomodoroTime = document.getElementById("pomodoroTime");
const pomodoroPhase = document.getElementById("pomodoroPhase");
const pomodoroProgress = document.getElementById("pomodoroProgress");
const pomodoroCount = document.getElementById("pomodoroCount");
const pomodoroStart = document.getElementById("pomodoroStart");
const pomodoroPause = document.getElementById("pomodoroPause");
const pomodoroReset = document.getElementById("pomodoroReset");
const pomodoroWork = document.getElementById("pomodoroWork");
const pomodoroShortBreak = document.getElementById("pomodoroShortBreak");
const pomodoroLongBreak = document.getElementById("pomodoroLongBreak");

let timer;
let timeLeft;
let isRunning = false;
let currentPhase = "work"; // 'work', 'shortBreak', 'longBreak'
let completedPomodorosToday =
  parseInt(localStorage.getItem("pomodorosToday")) || 0;

// Pomodoro ayarları
// Bu sabit tanımlamayı aşağıdaki fonksiyonla değiştirelim
// const settings = {
//     workDuration: 1 * 60, // 1 dakika
//     shortBreakDuration: 5 * 60, // 5 dakika
//     longBreakDuration: 15 * 60, // 15 dakika
//     pomodorosBeforeLongBreak: 4
// };

// Varsayılan ayarlar
const defaultSettings = {
  workDuration: 25 * 60, // 25 dakika
  shortBreakDuration: 5 * 60, // 5 dakika
  longBreakDuration: 15 * 60, // 15 dakika
  pomodorosBeforeLongBreak: 4,
};

// Ayarları localStorage'dan yükle veya varsayılan değerleri kullan
let settings = JSON.parse(localStorage.getItem("pomodoroSettings")) || {
  ...defaultSettings,
};

// Ayarları localStorage'a kaydet
function saveSettings() {
  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  // Timer sıfırlanmalı ve yeni ayarlarla güncellenmeli
  resetTimer();
  updateTabLabels();
  showNotification("Pomodoro ayarları güncellendi", "success");
}

// Ayarları formdaki değerlerle güncelle
function updateSettings() {
  const workDuration =
    parseInt(document.getElementById("settingWorkDuration").value) || 25;
  const shortBreakDuration =
    parseInt(document.getElementById("settingShortBreak").value) || 5;
  const longBreakDuration =
    parseInt(document.getElementById("settingLongBreak").value) || 15;
  const pomodorosBeforeLongBreak =
    parseInt(document.getElementById("settingPomodorosCount").value) || 4;

  settings.workDuration = workDuration * 60;
  settings.shortBreakDuration = shortBreakDuration * 60;
  settings.longBreakDuration = longBreakDuration * 60;
  settings.pomodorosBeforeLongBreak = pomodorosBeforeLongBreak;

  saveSettings();
}

// Form değerlerini mevcut ayarlarla doldur
function loadSettingsToForm() {
  document.getElementById("settingWorkDuration").value = Math.floor(
    settings.workDuration / 60
  );
  document.getElementById("settingShortBreak").value = Math.floor(
    settings.shortBreakDuration / 60
  );
  document.getElementById("settingLongBreak").value = Math.floor(
    settings.longBreakDuration / 60
  );
  document.getElementById("settingPomodorosCount").value =
    settings.pomodorosBeforeLongBreak;
}

// Pomodoro sekmelerinin metinlerini güncelle
function updateTabLabels() {
  const workDurationMinutes = Math.floor(settings.workDuration / 60);
  const shortBreakMinutes = Math.floor(settings.shortBreakDuration / 60);
  const longBreakMinutes = Math.floor(settings.longBreakDuration / 60);

  pomodoroWork.textContent = `Çalışma (${workDurationMinutes}dk)`;
  pomodoroShortBreak.textContent = `Kısa Mola (${shortBreakMinutes}dk)`;
  pomodoroLongBreak.textContent = `Uzun Mola (${longBreakMinutes}dk)`;
}

// Pomodoro zamanlayıcısını sıfırla fonksiyonunu güncelle
function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  pomodoroStart.classList.remove("hidden");
  pomodoroPause.classList.add("hidden");
  timeLeft =
    currentPhase === "work"
      ? settings.workDuration
      : currentPhase === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;
  updatePomodoroDisplay();
}

// Sayfa yüklendiğinde form değerlerini doldur
document.addEventListener("DOMContentLoaded", function () {
  // Mevcut kodlara ek olarak:
  loadSettingsToForm();
  updateTabLabels();
  // timeLeft'i ayarlardan yükle
  timeLeft = settings.workDuration; // Başlangıçta work fazında olduğumuz için

  // Ayarlar formuna submit event listener ekle
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateSettings();
        // Yeni gün kontrolü
  checkNewDay();
  
  // Kazanç istatistiklerini güncelle
  updateEarningsDisplay();
    });
  }
});

// Pomodoro'yu Başlat
function initPomodoro() {
  // timeLeft değerini mevcut faz ayarlarından yükle
  timeLeft =
    currentPhase === "work"
      ? settings.workDuration
      : currentPhase === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;

  updatePomodoroDisplay();
  pomodoroCount.textContent = completedPomodorosToday;
}

// Pomodoro ekranını güncelle
function updatePomodoroDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  pomodoroTime.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // İlerleme çemberini güncelle
  const totalDuration =
    currentPhase === "work"
      ? settings.workDuration
      : currentPhase === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;
  const progress = (timeLeft / totalDuration) * 283;
  pomodoroProgress.style.strokeDashoffset = progress;

  // Faz metnini güncelle
  pomodoroPhase.textContent =
    currentPhase === "work"
      ? "Çalışma"
      : currentPhase === "shortBreak"
      ? "Kısa Mola"
      : "Uzun Mola";
}

// Pomodoro zamanlayıcısını başlat
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  pomodoroStart.classList.add("hidden");
  pomodoroPause.classList.remove("hidden");

  timer = setInterval(() => {
    timeLeft--;
    updatePomodoroDisplay();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      pomodoroComplete();

      // Ses çal
      const audio = new Audio(
        "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
      );

      // Bildirim göster
      const phaseName =
        currentPhase === "work"
          ? "Çalışma"
          : currentPhase === "shortBreak"
          ? "Kısa mola"
          : "Uzun mola";
      showNotification(`${phaseName} yapabilirsin!`, "success");

      // Darbe animasyonu
      pomodoroTime.classList.add("pulse-animation");
      setTimeout(() => {
        pomodoroTime.classList.remove("pulse-animation");
      }, 3000);
    }
  }, 1000);
}

// Pomodoro zamanlayıcısını duraklat
function pauseTimer() {
  if (!isRunning) return;

  clearInterval(timer);
  isRunning = false;
  pomodoroStart.classList.remove("hidden");
  pomodoroPause.classList.add("hidden");
}

// // Pomodoro zamanlayıcısını sıfırla
// function resetTimer() {
//     clearInterval(timer);
//     isRunning = false;
//     pomodoroStart.classList.remove('hidden');
//     pomodoroPause.classList.add('hidden');
//     timeLeft = currentPhase === 'work' ? settings.workDuration :
//               currentPhase === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration;
//     updatePomodoroDisplay();
// }

// Pomodoro tamamlandı
function pomodoroComplete() {
  if (currentPhase === "work") {
    completedPomodorosToday++;
    pomodoroCount.textContent = completedPomodorosToday;
    localStorage.setItem("pomodorosToday", completedPomodorosToday);

    // Odak görev pomodorolarını güncelle (varsa)
    if (currentFocusTask) {
      const taskIndex = tasks.findIndex(
        (task) => task.id === currentFocusTask.id
      );
      if (taskIndex !== -1) {
        tasks[taskIndex].completedPomodoros =
          (tasks[taskIndex].completedPomodoros || 0) + 1;
        saveTasks();

        // Görev tamamlandı mı kontrol et
        if (
          tasks[taskIndex].completedPomodoros >=
          tasks[taskIndex].estimatedPomodoros
        ) {
          tasks[taskIndex].completed = true;
          saveTasks();
          showNotification("Görev tamamlandı!", "success");
          clearFocusTask();
        }

        renderTasks();
        updateFocusTaskDisplay();
      }
    }

    // Bir sonraki aşamayı belirle
    if (completedPomodorosToday % settings.pomodorosBeforeLongBreak === 0) {
      switchPhase("longBreak");
    } else {
      switchPhase("shortBreak");
    }
  } else {
    switchPhase("work");
  }
}

// Pomodoro aşamasını değiştir
function switchPhase(phase) {
  currentPhase = phase;

  switch (phase) {
    case "work":
      timeLeft = settings.workDuration;
      pomodoroWork.classList.add("active");
      pomodoroShortBreak.classList.remove("active");
      pomodoroLongBreak.classList.remove("active");
      break;
    case "shortBreak":
      timeLeft = settings.shortBreakDuration;
      pomodoroWork.classList.remove("active");
      pomodoroShortBreak.classList.add("active");
      pomodoroLongBreak.classList.remove("active");
      break;
    case "longBreak":
      timeLeft = settings.longBreakDuration;
      pomodoroWork.classList.remove("active");
      pomodoroShortBreak.classList.remove("active");
      pomodoroLongBreak.classList.add("active");
      break;
  }

  resetTimer();
}

// Pomodoro için olay dinleyicileri
pomodoroStart.addEventListener("click", startTimer);
pomodoroPause.addEventListener("click", pauseTimer);
pomodoroReset.addEventListener("click", resetTimer);

pomodoroWork.addEventListener("click", () => {
  if (currentPhase !== "work") {
    switchPhase("work");
  }
});

pomodoroShortBreak.addEventListener("click", () => {
  if (currentPhase !== "shortBreak") {
    switchPhase("shortBreak");
  }
});

pomodoroLongBreak.addEventListener("click", () => {
  if (currentPhase !== "longBreak") {
    switchPhase("longBreak");
  }
});

// Odak görev yönetimi
const selectFocusTask = document.getElementById("selectFocusTask");
const focusTaskContainer = document.getElementById("focusTaskContainer");
const focusTaskDetails = document.getElementById("focusTaskDetails");
const focusTaskTitle = document.getElementById("focusTaskTitle");
const focusTaskPomodoros = document.getElementById("focusTaskPomodoros");
const completePomodoro = document.getElementById("completePomodoro");
const completeFocusTask = document.getElementById("completeFocusTask");
const changeFocusTask = document.getElementById("changeFocusTask");
const taskSelectionModal = document.getElementById("taskSelectionModal");
const availableTasksList = document.getElementById("availableTasksList");
const closeTaskModal = document.getElementById("closeTaskModal");

// Odak görev seç
selectFocusTask.addEventListener("click", () => {
  showTaskSelectionModal();
});

// Kazanç takibi için değişkenler
let totalEarnings = parseFloat(localStorage.getItem("totalEarnings")) || 0;
let todayEarnings = parseFloat(localStorage.getItem("todayEarnings")) || 0;
let lastEarningsDate = localStorage.getItem("lastEarningsDate") || new Date().toLocaleDateString();

// Yeni gün kontrolü
function checkNewDay() {
  const today = new Date().toLocaleDateString();
  if (today !== lastEarningsDate) {
    todayEarnings = 0;
    localStorage.setItem("todayEarnings", todayEarnings);
    localStorage.setItem("lastEarningsDate", today);
  }
}

// Kazanç istatistiklerini güncelle
function updateEarningsDisplay() {
  const totalEarningsEl = document.getElementById("totalEarnings");
  const todayEarningsEl = document.getElementById("todayEarnings");

  if (totalEarningsEl) {
    totalEarningsEl.textContent = `₺${totalEarnings.toFixed(2)}`;
  }

  if (todayEarningsEl) {
    todayEarningsEl.textContent = `₺${todayEarnings.toFixed(2)}`;
  }
}

// Seans tamamlandığında kazanç ekleme
function addSessionEarning(task) {
  if (!task || !task.sessionRate || task.sessionRate <= 0) return;

  const earnedAmount = parseFloat(task.sessionRate);

  // Görev kazancını güncelle
  task.earnedAmount = (parseFloat(task.earnedAmount) || 0) + earnedAmount;

  // Genel kazançları güncelle
  totalEarnings += earnedAmount;
  todayEarnings += earnedAmount;

  // LocalStorage'a kaydet
  localStorage.setItem("totalEarnings", totalEarnings.toString());
  localStorage.setItem("todayEarnings", todayEarnings.toString());
  localStorage.setItem("lastEarningsDate", new Date().toLocaleDateString());

  // Görev dizisini güncelle (kazanç değeri değişti)
  saveTasks();

  // Ekranı güncelle
  updateEarningsDisplay();
  
  // Bildirim göster
  showNotification(`Seans tamamlandı! +₺${earnedAmount.toFixed(2)} kazandınız!`, 'success');
}

// Odak görev için pomodoro tamamla
completePomodoro.addEventListener("click", () => {
  if (!currentFocusTask) return;

  const taskIndex = tasks.findIndex((task) => task.id === currentFocusTask.id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completedPomodoros =
      (tasks[taskIndex].completedPomodoros || 0) + 1;

    // Görev tamamlandı mı kontrol et
    if (
      tasks[taskIndex].completedPomodoros >= tasks[taskIndex].estimatedPomodoros
    ) {
      tasks[taskIndex].completed = true;
      showNotification("Görev tamamlandı!", "success");
      clearFocusTask();
    }

    saveTasks();
        // Kazanç ekle
    addSessionEarning(currentFocusTask);
    
    renderTasks();
    updateFocusTaskDisplay();
    showNotification("Bu görev için pomodoro tamamlandı", "info");
  }
});

// Odak görevi tamamla
completeFocusTask.addEventListener("click", () => {
  if (!currentFocusTask) return;

  const taskIndex = tasks.findIndex((task) => task.id === currentFocusTask.id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = true;
    saveTasks();
    renderTasks();
    clearFocusTask();
    showNotification("Görev tamamlandı olarak işaretlendi", "success");
  }
});

// Odak görev değiştir
changeFocusTask.addEventListener("click", () => {
  showTaskSelectionModal();
});

// Görev modalını kapat
closeTaskModal.addEventListener("click", () => {
  taskSelectionModal.classList.add("hidden");
});

// Görev seçim modalını göster
function showTaskSelectionModal() {
  // Tamamlanmış görevleri filtrele
  const availableTasks = tasks.filter((task) => !task.completed);

  if (availableTasks.length === 0) {
    showNotification("Kullanılabilir görev yok", "info");
    return;
  }

  availableTasksList.innerHTML = availableTasks
    .map(
      (task) => `
                <div class="p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-id="${
                  task.id
                }">
                    <h4 class="font-medium">${task.title}</h4>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            ${task.estimatedPomodoros || 1} seans
                        </span>
                        <span class="text-xs px-2 py-1 rounded-full ${getPriorityClass(
                          task.priority
                        )}">
                            ${getPriorityLabel(task.priority)}
                        </span>
                    </div>
                </div>
            `
    )
    .join("");

  // Görev öğelerine olay dinleyicileri ekle
  document.querySelectorAll("#availableTasksList > div").forEach((item) => {
    item.addEventListener("click", () => {
      const taskId = parseInt(item.dataset.id);
      const selectedTask = tasks.find((task) => task.id === taskId);

      if (selectedTask) {
        setFocusTask(selectedTask);
        taskSelectionModal.classList.add("hidden");
      }
    });
  });

  taskSelectionModal.classList.remove("hidden");
}

// Odak görev ayarla
function setFocusTask(task) {
  currentFocusTask = task;
  updateFocusTaskDisplay();

  focusTaskContainer.classList.add("hidden");
  focusTaskDetails.classList.remove("hidden");

  showNotification(`"${task.title}" görevi seçildi`, "info");
}

// Odak görev temizle
function clearFocusTask() {
  currentFocusTask = null;
  focusTaskContainer.classList.remove("hidden");
  focusTaskDetails.classList.add("hidden");
}

// Odak görev ekranını güncelle
function updateFocusTaskDisplay() {
  if (!currentFocusTask) return;

  focusTaskTitle.textContent = currentFocusTask.title;
  focusTaskPomodoros.textContent = `${
    currentFocusTask.completedPomodoros || 0
  }/${currentFocusTask.estimatedPomodoros || 1} seans`;
}

// Form gönderimi
const taskForm = document.getElementById("taskForm");
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  if (!title) {
    showNotification("Lütfen görev için bir başlık girin", "error");
    return;
  }

  const category = document.getElementById("taskCategory").value;
  const priority = document.getElementById("taskPriority").value;
  const startDate = document.getElementById("taskStartDate").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const estimatedPomodoros =
    parseInt(document.getElementById("taskPomodoros").value) || 1;
  const sessionRate = document.getElementById("taskSessionRate").value;
  const description = document.getElementById("taskDescription").value;

  const newTask = {
    id: Date.now(),
    title,
    category,
    priority,
    startDate, // Yeni eklenen başlangıç tarihi alanı
    dueDate,
    estimatedPomodoros,
    completedPomodoros: 0,
    description,
    sessionRate: parseFloat(sessionRate), // Yeni eklendi
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  showNotification("Görev başarıyla eklendi!", "success");

  // Formu sıfırla
  taskForm.reset();
  document.getElementById("taskPomodoros").value = 1;
  document.getElementById("taskTitle").focus();
});

// Görev düzenleme fonksiyonları ve modal işlemleri

// Düzenleme modalı için gerekli değişkenleri tanımlayalım
const taskEditModal = document.getElementById("taskEditModal");
const closeEditModal = document.getElementById("closeEditModal");
const editTaskForm = document.getElementById("editTaskForm");
const cancelEditTask = document.getElementById("cancelEditTask");
const editTaskId = document.getElementById("editTaskId");

// Düzenleme modalını kapat
function closeEditTaskModal() {
  taskEditModal.classList.add("hidden");
}

// Düzenleme modalını aç ve görev bilgilerini doldur
function openEditTaskModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Form alanlarını mevcut görev bilgileriyle doldur
  editTaskId.value = task.id;
  document.getElementById("editTaskTitle").value = task.title || "";
  document.getElementById("editTaskCategory").value = task.category || "daily";
  document.getElementById("editTaskPriority").value = task.priority || "medium";
  document.getElementById("editTaskStartDate").value = task.startDate || ""; // Yeni eklenen başlangıç tarihi alanı
  document.getElementById("editTaskDueDate").value = task.dueDate || "";
  document.getElementById("editTaskPomodoros").value = task.estimatedPomodoros || 1;
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById('editTaskSessionRate').value = task.sessionRate ? task.sessionRate.toFixed(2) : '0.00'; // Yeni eklendi


  // Modalı göster
  taskEditModal.classList.remove("hidden");
}

// Görevi güncelle
function updateTask(e) {
  e.preventDefault();

  const taskId = parseInt(editTaskId.value);
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    showNotification("Düzenlenecek görev bulunamadı", "error");
    return;
  }

  const updatedTask = {
    ...tasks[taskIndex],
    title: document.getElementById("editTaskTitle").value.trim(),
    category: document.getElementById("editTaskCategory").value,
    priority: document.getElementById("editTaskPriority").value,
    startDate: document.getElementById("editTaskStartDate").value, // Yeni eklenen başlangıç tarihi alanı
    dueDate: document.getElementById("editTaskDueDate").value,
    estimatedPomodoros: parseInt(document.getElementById("editTaskPomodoros").value) || 1,
    description: document.getElementById("editTaskDescription").value,
    sessionRate: parseFloat(document.getElementById('editTaskSessionRate').value),

    updatedAt: new Date().toISOString(),
  };

  // Düzenlenmiş görevi diziye kaydet
  tasks[taskIndex] = updatedTask;
  saveTasks();

  // Odak görev bu görevse, odak görev ekranını güncelle
  if (currentFocusTask && currentFocusTask.id === taskId) {
    currentFocusTask = updatedTask;
    updateFocusTaskDisplay();
  }

  // Modalı kapat ve bildirim göster
  closeEditTaskModal();
  showNotification("Görev başarıyla güncellendi", "success");

  // Görev listesini yeniden oluştur
  const activeFilter =
    document.querySelector(".filter-btn.active").dataset.filter;
  const sortBy = document.getElementById("sortTasks").value;
  renderTasks(activeFilter, sortBy);
  updateStats();
}

// Olay dinleyicileri ekle
closeEditModal.addEventListener("click", closeEditTaskModal);
cancelEditTask.addEventListener("click", closeEditTaskModal);
editTaskForm.addEventListener("submit", updateTask);

// Düzenleme düğmelerine tıklanınca modal açılması için renderTasks fonksiyonunu güncelleyelim

// Görevleri localStorage'a kaydet
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateStats();
}

// İstatistikleri güncelle
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressBar").style.width = `${percent}%`;
  updateEarningsDisplay();
}

// Görevleri oluştur
function renderTasks(filter = "all", sortBy = "priority") {
  const taskList = document.getElementById("taskList");
  const completedTaskList = document.getElementById("completedTaskList");

  // Görevleri filtrele
  let filteredTasks = [...tasks];
  if (filter !== "all") {
    filteredTasks = filteredTasks.filter((task) => task.category === filter);
  }

  // Tamamlanmış ve aktif görevleri ayır
  const activeTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  // Görevleri sırala
  function sortTasks(taskArray) {
    return taskArray.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === "startDate") {
        // Başlangıç tarihine göre sıralama
        activeTasks.sort((a, b) => {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate) - new Date(b.startDate);
        });
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  const sortedActiveTasks = sortTasks(activeTasks);
  const sortedCompletedTasks = sortTasks(completedTasks);

  // Aktif görev listesini oluştur
  if (sortedActiveTasks.length === 0) {
    taskList.innerHTML = `
                    <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                        Aktif görev yok. Yeni bir görev ekleyin!
                    </div>
                `;
  } else {
    taskList.innerHTML = sortedActiveTasks
      .map(
        (task) => `
                    <div class="task-item p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative group" data-id="${task.id}">
                        <div class="flex items-start space-x-3">
                            <button class="complete-btn mt-1" data-id="${task.id}" title="Tamamlandı olarak işaretle">
                                <i class="far fa-circle text-gray-300 dark:text-gray-500 hover:text-green-500"></i>
                            </button>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-medium">${task.title}</h3>
                                ${
                                  task.description
                                    ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${task.description}</p>`
                                    : ""
                                }
                                <div class="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                    <span class="px-2 py-1 rounded-full ${getCategoryClass(
                                      task.category
                                    )}">
                                        ${getCategoryLabel(task.category)}
                                    </span>
                                    <span class="px-2 py-1 rounded-full ${getPriorityClass(
                                      task.priority
                                    )}">
                                        <span class="priority-dot ${getPriorityDotClass(
                                          task.priority
                                        )}"></span>
                                        ${getPriorityLabel(task.priority)}
                                    </span>
                                    ${
                                      task.startDate
                                        ? `<span class="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            <i class="far fa-calendar mr-1"></i>${formatDate(
                              task.startDate
                            )}
                        </span>`
                                        : ""
                                    }
                                    ${
                                      task.dueDate
                                        ? `<span class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                            <i class="far fa-calendar-alt mr-1"></i>${formatDate(
                              task.dueDate
                            )}
                        </span>`
                                        : ""
                                    }
                                    <span class="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                        <i class="fas fa-clock mr-1"></i>${
                                          task.completedPomodoros || 0
                                        }/${task.estimatedPomodoros || 1}
                                    </span>
                                        ${Number(task.sessionRate) > 0 ? `<span class="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
    <i class="fas fa-coins mr-1"></i>₺${parseFloat(task.sessionRate).toFixed(2)}
</span>` : ''}
    ${(task.earnedAmount && task.earnedAmount > 0) ? `<span class="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
        <i class="fas fa-wallet mr-1"></i>Kazanç: ₺${task.earnedAmount.toFixed(2)}
    </span>` : ''}
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="edit-task-btn text-gray-400 hover:text-blue-500" data-id="${task.id}" title="Düzenle">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="quick-delete-btn text-gray-400 hover:text-red-500" data-id="${task.id}" title="Sil">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `
      )
      .join("");
  }

  // Tamamlanmış görev listesini oluştur
  if (sortedCompletedTasks.length === 0) {
    completedTaskList.innerHTML = `
                    <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                        Tamamlanmış görev yok
                    </div>
                `;
  } else {
    completedTaskList.innerHTML = sortedCompletedTasks
      .map(
        (task) => `
                    <div class="completed-task p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative group" data-id="${task.id}">
                        <div class="flex items-start space-x-3">
                            <button class="complete-btn mt-1 text-green-500" data-id="${task.id}" title="Tamamlanmamış olarak işaretle">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-medium text-gray-400 dark:text-gray-500">${
                                  task.title
                                }</h3>
                                ${
                                  task.description
                                    ? `<p class="text-sm text-gray-400 dark:text-gray-500 mt-1">${task.description}</p>`
                                    : ""
                                }
                                <div class="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                    <span class="px-2 py-1 rounded-full ${getCategoryClass(
                                      task.category
                                    )} opacity-70">
                                        ${getCategoryLabel(task.category)}
                                    </span>
                                    <span class="px-2 py-1 rounded-full ${getPriorityClass(
                                      task.priority
                                    )} opacity-70">
                                        <span class="priority-dot ${getPriorityDotClass(
                                          task.priority
                                        )}"></span>
                                        ${getPriorityLabel(task.priority)}
                                    </span>
                                    ${
                                      task.dueDate
                                        ? `<span class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 opacity-70">
                                        <i class="far fa-calendar-alt mr-1"></i>${formatDate(
                                          task.dueDate
                                        )}
                                    </span>`
                                        : ""
                                    }
                                    <span class="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 opacity-70">
                                        <i class="fas fa-clock mr-1"></i>${
                                          task.completedPomodoros || 0
                                        }/${task.estimatedPomodoros || 1}
                                    </span>
                                </div>
                            </div>
                            <button class="quick-delete-btn text-gray-400 hover:text-red-500 absolute top-4 right-4" data-id="${task.id}" title="Sil">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `
      )
      .join("");
  }

  // Düğmelere olay dinleyicileri ekle
  document.querySelectorAll(".complete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(btn.dataset.id);
      toggleTaskComplete(taskId);
      e.stopPropagation();
    });
  });

  document.querySelectorAll(".edit-task-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(btn.dataset.id);
      openEditTaskModal(taskId);
      e.stopPropagation();
    });
  });

  document.querySelectorAll(".quick-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskId = parseInt(btn.dataset.id);
      deleteTask(taskId);
      e.stopPropagation();
    });
  });

  // Odak görev tamamlandıysa, temizle
  if (currentFocusTask) {
    const taskStillExists = tasks.some(
      (task) => task.id === currentFocusTask.id && !task.completed
    );
    if (!taskStillExists) {
      clearFocusTask();
    }
  }

  updateStats();
}

// Yardımcı fonksiyonlar
function getCategoryClass(category) {
  switch (category) {
    case "daily":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "revision":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "work":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "personal":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

function getCategoryLabel(category) {
  switch (category) {
    case "daily":
      return "Günlük";
    case "revision":
      return "Tekrar";
    case "work":
      return "İş";
    case "personal":
      return "Kişisel";
    default:
      return category;
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "medium":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

function getPriorityDotClass(priority) {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-orange-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function getPriorityLabel(priority) {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    case "low":
      return "Düşük";
    default:
      return priority;
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("tr-TR", options);
}

// Görev eylemleri
function toggleTaskComplete(taskId) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();

    const activeFilter =
      document.querySelector(".filter-btn.active").dataset.filter;
    const sortBy = document.getElementById("sortTasks").value;
    renderTasks(activeFilter, sortBy);

    const message = tasks[taskIndex].completed
      ? "Görev tamamlandı olarak işaretlendi!"
      : "Görev tamamlanmamış olarak işaretlendi";
    showNotification(message, "info");

    // Odak görev tamamlandıysa, temizle
    if (
      currentFocusTask &&
      currentFocusTask.id === taskId &&
      tasks[taskIndex].completed
    ) {
      clearFocusTask();
    }
  }
}

function deleteTask(taskId) {
  if (confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();

    const activeFilter =
      document.querySelector(".filter-btn.active").dataset.filter;
    const sortBy = document.getElementById("sortTasks").value;
    renderTasks(activeFilter, sortBy);

    showNotification("Görev başarıyla silindi!", "warning");

    // Odak görev silindiyse, temizle
    if (currentFocusTask && currentFocusTask.id === taskId) {
      clearFocusTask();
    }
  }
}

// Filtre düğmeleri
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.remove("active", "bg-blue-500", "text-white");
      b.classList.add(
        "bg-gray-200",
        "dark:bg-gray-700",
        "hover:bg-gray-300",
        "dark:hover:bg-gray-600"
      );
    });

    btn.classList.add("active", "bg-blue-500", "text-white");
    btn.classList.remove(
      "bg-gray-200",
      "dark:bg-gray-700",
      "hover:bg-gray-300",
      "dark:hover:bg-gray-600"
    );

    const filter = btn.dataset.filter;
    const sortBy = document.getElementById("sortTasks").value;
    renderTasks(filter, sortBy);
  });
});

// Sıralama seçimi
document.getElementById("sortTasks").addEventListener("change", () => {
  const activeFilter =
    document.querySelector(".filter-btn.active").dataset.filter;
  const sortBy = document.getElementById("sortTasks").value;
  renderTasks(activeFilter, sortBy);
});

// Tamamlanmış görevleri göster/gizle
document.getElementById("showCompleted").addEventListener("click", () => {
  showCompletedTasks = !showCompletedTasks;
  const completedContainer = document.getElementById("completedTasksContainer");
  const showBtn = document.getElementById("showCompleted");

  if (showCompletedTasks) {
    completedContainer.classList.remove("hidden");
    showBtn.innerHTML =
      '<i class="far fa-eye-slash mr-2"></i>Tamamlananları Gizle';
  } else {
    completedContainer.classList.add("hidden");
    showBtn.innerHTML = '<i class="far fa-eye mr-2"></i>Tamamlananları Göster';
  }
});

// Tamamlanmış görevleri temizle
document.getElementById("clearCompleted").addEventListener("click", () => {
  if (
    confirm("Tüm tamamlanmış görevleri silmek istediğinizden emin misiniz?")
  ) {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
    showNotification("Tüm tamamlanmış görevler silindi", "warning");

    // Odak görev tamamlandıysa, temizle
    if (currentFocusTask) {
      const taskStillExists = tasks.some(
        (task) => task.id === currentFocusTask.id
      );
      if (!taskStillExists) {
        clearFocusTask();
      }
    }
  }
});

// Tamamlanmış panelinden tüm tamamlanmış görevleri temizle
document.getElementById("clearAllCompleted").addEventListener("click", () => {
  if (
    confirm("Tüm tamamlanmış görevleri silmek istediğinizden emin misiniz?")
  ) {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
    showNotification("Tüm tamamlanmış görevler silindi", "warning");

    // Odak görev tamamlandıysa, temizle
    if (currentFocusTask) {
      const taskStillExists = tasks.some(
        (task) => task.id === currentFocusTask.id
      );
      if (!taskStillExists) {
        clearFocusTask();
      }
    }
  }
});

// Tüm görevleri tamamla
document.getElementById("completeAll").addEventListener("click", () => {
  if (confirm("Tüm görevleri tamamlandı olarak işaretle?")) {
    tasks.forEach((task) => {
      task.completed = true;
    });
    saveTasks();
    renderTasks();
    showNotification("Tüm görevler tamamlandı olarak işaretlendi", "success");
    clearFocusTask();
  }
});

// Tüm görevleri sil
document.getElementById("deleteAll").addEventListener("click", () => {
  if (
    confirm(
      "Tüm görevleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
    )
  ) {
    tasks = [];
    saveTasks();
    renderTasks();
    showNotification("Tüm görevler silindi", "error");
    clearFocusTask();
  }
});

// Bildirim fonksiyonu
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4 ${
    type === "success"
      ? "border-green-500"
      : type === "error"
      ? "border-red-500"
      : type === "warning"
      ? "border-yellow-500"
      : "border-blue-500"
  }`;
  notification.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold ${
                          type === "success"
                            ? "text-green-700 dark:text-green-300"
                            : type === "error"
                            ? "text-red-700 dark:text-red-300"
                            : type === "warning"
                            ? "text-yellow-700 dark:text-yellow-300"
                            : "text-blue-700 dark:text-blue-300"
                        }">${
    type === "success"
      ? "Başarılı"
      : type === "error"
      ? "Hata"
      : type === "warning"
      ? "Uyarı"
      : "Bilgi"
  }</h3>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${message}</p>
                    </div>
                    <button class="close-notification text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

  notification
    .querySelector(".close-notification")
    .addEventListener("click", () => {
      notification.remove();
    });

  document.getElementById("notificationArea").appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Initialize the app
initPomodoro();
renderTasks();
updateStats();

// Reset pomodoro count at midnight
function checkPomodoroReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeUntilMidnight = tomorrow - now;

  setTimeout(() => {
    completedPomodorosToday = 0;
    pomodoroCount.textContent = completedPomodorosToday;
    localStorage.setItem("pomodorosToday", completedPomodorosToday);
    checkPomodoroReset(); // Reset again next midnight
  }, timeUntilMidnight);
}

checkPomodoroReset();
