import { createTask, PomodoroTimer, type Task } from "@tasksorg/core";

const PHASE_LABEL: Record<string, string> = {
  focus: "Foco",
  shortBreak: "Pausa curta",
  longBreak: "Pausa longa",
};

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

let tasks: Task[] = [];

function renderTasks(): void {
  const list = document.getElementById("task-list");
  if (!list) return;
  list.innerHTML = "";
  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = task.status === "done" ? "done" : "";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "done";
    checkbox.addEventListener("change", () => {
      task.status = task.status === "done" ? "todo" : "done";
      renderTasks();
    });

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = ` ${task.title}`;

    const label = document.createElement("label");
    label.appendChild(checkbox);
    label.appendChild(title);

    li.appendChild(label);
    list.appendChild(li);
  }
}

function setupTaskForm(): void {
  const form = document.getElementById("task-form") as HTMLFormElement | null;
  const input = document.getElementById("task-input") as HTMLInputElement | null;
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    tasks.push(createTask({ title: input.value, scope: "daily" }));
    input.value = "";
    renderTasks();
  });
}

function setupPomodoro(): void {
  const timer = new PomodoroTimer();
  const phaseEl = document.getElementById("pomodoro-phase");
  const timeEl = document.getElementById("pomodoro-time");

  function render(): void {
    const snap = timer.getSnapshot();
    if (phaseEl) phaseEl.textContent = PHASE_LABEL[snap.phase] ?? snap.phase;
    if (timeEl) timeEl.textContent = formatTime(snap.remainingSeconds);
  }

  document.getElementById("btn-start")?.addEventListener("click", () => {
    timer.start();
    render();
  });
  document.getElementById("btn-pause")?.addEventListener("click", () => {
    timer.pause();
    render();
  });
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    timer.reset();
    render();
  });

  setInterval(() => {
    timer.tick(1);
    render();
  }, 1000);

  render();
}

window.addEventListener("DOMContentLoaded", () => {
  setupTaskForm();
  setupPomodoro();
  renderTasks();
});
