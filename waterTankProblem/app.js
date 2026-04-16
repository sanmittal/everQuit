function trappingWater(arr) {
  let left = 0,
      right = arr.length - 1,
      leftMax = 0,
      rightMax = 0,
      water = 0;

  while (left < right) {
    if (arr[left] < arr[right]) {
      if (arr[left] >= leftMax) {
        leftMax = arr[left];
      } else {
        water += leftMax - arr[left];
      }
      left++;
    } else {
      if (arr[right] >= rightMax) {
        rightMax = arr[right];
      } else {
        water += rightMax - arr[right];
      }
      right--;
    }
  }

  return water;
}

// SVG visualization
function draw(arr) {
  const svg = document.getElementById("canvas");
  svg.innerHTML = "";

  const width = 50;

  const maxHeight = Math.max(...arr);

  arr.forEach((h, i) => {
    const x = i * width;
    const y = 300 - h * 20;

    // block
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", 40);
    rect.setAttribute("height", h * 20);
    rect.setAttribute("fill", "#3498db");

    svg.appendChild(rect);
  });
}

function calculate() {
  const input = document.getElementById("input").value;
  const arr = input.split(",").map(Number);

  const result = trappingWater(arr);

  document.getElementById("result").innerText =
    "Units: " + result;

  draw(arr);
}