// Общие функции не зависят от Canvas: их можно проверить отдельно.
window.LUM = window.LUM || {};
LUM.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
LUM.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
LUM.formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
