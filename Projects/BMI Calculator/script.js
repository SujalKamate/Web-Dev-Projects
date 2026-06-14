function calculateBMI() {
  const unit = document.getElementById("unitSelect").value;
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);

  if (!weight || !height || weight <= 0 || height <= 0) {
    alert("Please enter valid weight and height!");
    return;
  }

  let bmi;
  if (unit === "metric") {
    bmi = weight / ((height / 100) ** 2);
  } else {
    bmi = (703 * weight) / (height ** 2);
  }

  const category = getBMICategory(bmi);

  document.getElementById("bmiValue").textContent = `BMI: ${bmi.toFixed(2)}`;
  document.getElementById("bmiCategory").textContent = `Category: ${category}`;
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 24.9) return "Normal weight";
  if (bmi < 29.9) return "Overweight";
  return "Obese";
}

function resetForm() {
  document.getElementById("weight").value = "";
  document.getElementById("height").value = "";
  document.getElementById("bmiValue").textContent = "BMI: —";
  document.getElementById("bmiCategory").textContent = "Category: —";
}
