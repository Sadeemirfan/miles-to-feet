// src/calculator.js

document.addEventListener('DOMContentLoaded', () => {
  const FACTOR = 5280;

  const t = (key, defaultText) => {
    if (window.PAGE_TRANSLATIONS && window.PAGE_TRANSLATIONS[key] !== undefined) {
      return window.PAGE_TRANSLATIONS[key];
    }
    return defaultText;
  };

  // --- Accordion FAQ engine ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    btn.addEventListener('click', () => {
      // Toggle current
      const isOpen = item.classList.contains('open');
      
      // Close other FAQs
      faqItems.forEach(other => other.classList.remove('open'));
      
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // --- Dynamic Conversion Table Switcher ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tableContainers = document.querySelectorAll('.table-container');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tableContainers.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      const targetTable = document.getElementById(targetId);
      if (targetTable) {
        targetTable.classList.add('active');
      }
    });
  });

  // --- Conversion Calculator Widget ---
  const milesInput = document.getElementById('miles-input');
  const feetOutput = document.getElementById('feet-output');
  
  const feetInput = document.getElementById('feet-input');
  const milesOutput = document.getElementById('miles-output');
  
  const formulaStep = document.getElementById('formula-step');

  const formatNumber = (num, decimals = 4) => {
    // Standard format, removing trailing zeros
    const fixedVal = Number(num.toFixed(decimals));
    return fixedVal.toLocaleString('en-US', { maximumFractionDigits: decimals });
  };

  const parseNumber = (val) => {
    // Strip commas and convert to float
    return parseFloat(val.replace(/,/g, ''));
  };

  // 1. Miles to Feet Calculator logic
  const isMilesToFeetPage = milesInput && feetOutput && !document.querySelector('.calculator-card[data-converter]') && !window.location.pathname.includes('/feet-to-miles/');
  if (isMilesToFeetPage) {
    const calculateMilesToFeet = () => {
      const milesVal = milesInput.value.trim();
      if (milesVal === '' || isNaN(milesVal)) {
        feetOutput.value = '';
        if (formulaStep) formulaStep.innerHTML = t('formula_step_default', 'Enter a valid number above to see the calculation.');
        return;
      }
      
      const miles = parseFloat(milesVal);
      if (miles < 0) {
        feetOutput.value = t('formula_step_invalid', 'Invalid input');
        if (formulaStep) formulaStep.innerHTML = `<span style="color: var(--accent);">${t('formula_step_negative', 'Distance cannot be negative.')}</span>`;
        return;
      }
      
      const feet = miles * FACTOR;
      feetOutput.value = formatNumber(feet);
      
      if (formulaStep) {
        formulaStep.innerHTML = `
          <strong>${t('step_num', 'Step')} 1:</strong> ${t('formula_step_identify', 'Identify the formula:')} <code>feet = miles &times; 5,280</code><br>
          <strong>${t('step_num', 'Step')} 2:</strong> ${t('formula_step_substitute', 'Substitute value:')} <code>${miles.toLocaleString()} &times; 5,280</code><br>
          <strong>${t('step_num', 'Step')} 3:</strong> ${t('formula_step_solve', 'Solve:')} <strong>${formatNumber(feet)} ${t('unit_feet', 'feet')}</strong>
        `;
      }
    };

    milesInput.addEventListener('input', calculateMilesToFeet);
    calculateMilesToFeet(); // initial run

    // --- History Engine ---
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const historyClearBtn = document.getElementById('history-clear');
    const STORAGE_KEY = 'history_miles_to_feet';

    const getHistory = () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    };

    const renderHistory = () => {
      const history = getHistory();
      if (history.length === 0) {
        historySection.style.display = 'none';
        return;
      }
      historySection.style.display = 'flex';
      historyList.innerHTML = '';
      history.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'history-btn';
        btn.innerHTML = `${val} mi`;
        btn.setAttribute('data-value', val);
        btn.addEventListener('click', () => {
          milesInput.value = val;
          calculateMilesToFeet();
        });
        historyList.appendChild(btn);
      });
    };

    const addToHistory = (val) => {
      if (val === '' || isNaN(val) || parseFloat(val) < 0) return;
      const numVal = parseFloat(val);
      let history = getHistory();
      history = history.filter(v => parseFloat(v) !== numVal);
      history.unshift(numVal);
      history = history.slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      renderHistory();
    };

    // Event listeners
    milesInput.addEventListener('change', () => {
      addToHistory(milesInput.value.trim());
    });

    if (historyClearBtn) {
      historyClearBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
      });
    }

    renderHistory();

    // Presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        milesInput.value = val;
        calculateMilesToFeet();
        addToHistory(val);
      });
    });
  }

  // 2. Feet to Miles Calculator logic
  const isFeetToMilesPage = feetInput && milesOutput && !document.querySelector('.calculator-card[data-converter]');
  if (isFeetToMilesPage) {
    const calculateFeetToMiles = () => {
      const feetVal = feetInput.value.trim();
      if (feetVal === '' || isNaN(feetVal)) {
        milesOutput.value = '';
        if (formulaStep) formulaStep.innerHTML = t('formula_step_default', 'Enter a valid number above to see the calculation.');
        return;
      }

      const feet = parseFloat(feetVal);
      if (feet < 0) {
        milesOutput.value = t('formula_step_invalid', 'Invalid input');
        if (formulaStep) formulaStep.innerHTML = `<span style="color: var(--accent);">${t('formula_step_negative', 'Distance cannot be negative.')}</span>`;
        return;
      }

      const miles = feet / FACTOR;
      milesOutput.value = formatNumber(miles, 5); // display higher precision for division

      if (formulaStep) {
        formulaStep.innerHTML = `
          <strong>${t('step_num', 'Step')} 1:</strong> ${t('formula_step_identify', 'Identify the formula:')} <code>miles = feet &divide; 5,280</code><br>
          <strong>${t('step_num', 'Step')} 2:</strong> ${t('formula_step_substitute', 'Substitute value:')} <code>${feet.toLocaleString()} &divide; 5,280</code><br>
          <strong>${t('step_num', 'Step')} 3:</strong> ${t('formula_step_solve', 'Solve:')} <strong>${formatNumber(miles, 5)} ${t('unit_miles', 'miles')}</strong>
        `;
      }
    };

    feetInput.addEventListener('input', calculateFeetToMiles);
    calculateFeetToMiles(); // initial run

    // --- History Engine ---
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const historyClearBtn = document.getElementById('history-clear');
    const STORAGE_KEY = 'history_feet_to_miles';

    const getHistory = () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    };

    const renderHistory = () => {
      const history = getHistory();
      if (history.length === 0) {
        historySection.style.display = 'none';
        return;
      }
      historySection.style.display = 'flex';
      historyList.innerHTML = '';
      history.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'history-btn';
        btn.innerHTML = `${parseInt(val).toLocaleString()} ft`;
        btn.setAttribute('data-value', val);
        btn.addEventListener('click', () => {
          feetInput.value = val;
          calculateFeetToMiles();
        });
        historyList.appendChild(btn);
      });
    };

    const addToHistory = (val) => {
      if (val === '' || isNaN(val) || parseFloat(val) < 0) return;
      const numVal = parseFloat(val);
      let history = getHistory();
      history = history.filter(v => parseFloat(v) !== numVal);
      history.unshift(numVal);
      history = history.slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      renderHistory();
    };

    // Event listeners
    feetInput.addEventListener('change', () => {
      addToHistory(feetInput.value.trim());
    });

    if (historyClearBtn) {
      historyClearBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
      });
    }

    renderHistory();

    // Presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        feetInput.value = val;
        calculateFeetToMiles();
        addToHistory(val);
      });
    });
  }


  // --- Generic Multi-Unit Calculator Widget ---
  const genericCard = document.querySelector('.calculator-card[data-converter]');
  if (genericCard) {
    const converter = genericCard.getAttribute('data-converter');
    const factor = parseFloat(genericCard.getAttribute('data-factor'));
    const operation = genericCard.getAttribute('data-operation') || 'multiply';
    const inputUnit = genericCard.getAttribute('data-input-unit') || 'mi';
    const outputUnit = genericCard.getAttribute('data-output-unit') || 'ft';
    
    const inputField = genericCard.querySelector('.input-group:first-child .input-field') || document.getElementById('calc-input');
    const outputField = genericCard.querySelector('.input-group:last-child .input-field') || document.getElementById('calc-output');
    const formulaStep = document.getElementById('formula-step');
    
    const STORAGE_KEY = `history_${converter}`;

    const calculateGeneric = () => {
      if (!inputField || !outputField) return;
      const inputValStr = inputField.value.trim();
      if (inputValStr === '' || isNaN(inputValStr)) {
        outputField.value = '';
        if (formulaStep) formulaStep.innerHTML = t('formula_step_default_generic', 'Enter a valid value above to see the calculation.');
        return;
      }
      
      const inputVal = parseFloat(inputValStr);
      if (inputVal < 0) {
        outputField.value = t('formula_step_invalid', 'Invalid input');
        if (formulaStep) formulaStep.innerHTML = `<span style="color: var(--accent);">${t('formula_step_negative_generic', 'Value cannot be negative.')}</span>`;
        return;
      }
      
      let result = 0;
      if (operation === 'multiply') {
        result = inputVal * factor;
      } else {
        result = inputVal / factor;
      }
      
      const decimals = result < 0.01 ? 6 : (result < 1 ? 4 : 2);
      outputField.value = formatNumber(result, decimals);
      
      if (formulaStep) {
        const symbol = operation === 'multiply' ? '&times;' : '&divide;';
        formulaStep.innerHTML = `
          <strong>${t('step_num', 'Step')} 1:</strong> ${t('formula_step_identify', 'Identify the formula:')} <code>${outputUnit} = ${inputUnit} ${symbol} ${factor.toLocaleString('en-US', { maximumFractionDigits: 10 })}</code><br>
          <strong>${t('step_num', 'Step')} 2:</strong> ${t('formula_step_substitute', 'Substitute value:')} <code>${inputVal.toLocaleString()} ${symbol} ${factor.toLocaleString('en-US', { maximumFractionDigits: 10 })}</code><br>
          <strong>${t('step_num', 'Step')} 3:</strong> ${t('formula_step_solve', 'Solve:')} <strong>${formatNumber(result, decimals)} ${outputUnit}</strong>
        `;
      }
    };

    if (inputField) {
      inputField.addEventListener('input', calculateGeneric);
      calculateGeneric(); // initial run
    }

    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const historyClearBtn = document.getElementById('history-clear');

    const getHistory = () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    };

    const renderHistory = () => {
      if (!historySection || !historyList) return;
      const history = getHistory();
      if (history.length === 0) {
        historySection.style.display = 'none';
        return;
      }
      historySection.style.display = 'flex';
      historyList.innerHTML = '';
      history.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'history-btn';
        btn.innerHTML = `${val} ${inputUnit}`;
        btn.setAttribute('data-value', val);
        btn.addEventListener('click', () => {
          inputField.value = val;
          calculateGeneric();
        });
        historyList.appendChild(btn);
      });
    };

    const addToHistory = (val) => {
      if (val === '' || isNaN(val) || parseFloat(val) < 0) return;
      const numVal = parseFloat(val);
      let history = getHistory();
      history = history.filter(v => parseFloat(v) !== numVal);
      history.unshift(numVal);
      history = history.slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      renderHistory();
    };

    if (inputField) {
      inputField.addEventListener('change', () => {
        addToHistory(inputField.value.trim());
      });
    }

    if (historyClearBtn) {
      historyClearBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
      });
    }

    renderHistory();

    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        if (inputField) {
          inputField.value = val;
          calculateGeneric();
          addToHistory(val);
        }
      });
    });
  }

  // --- Interactive Diagrams Engine ---
  const genericCardElement = document.querySelector('.calculator-card[data-converter]');
  
  let factor = 5280;
  let operation = 'multiply';
  let inputUnit = 'mi';
  let outputUnit = 'ft';
  let inputName = 'Miles';
  let outputName = 'Feet';

  if (genericCardElement) {
    factor = parseFloat(genericCardElement.getAttribute('data-factor')) || 5280;
    operation = genericCardElement.getAttribute('data-operation') || 'multiply';
    inputUnit = genericCardElement.getAttribute('data-input-unit') || 'mi';
    outputUnit = genericCardElement.getAttribute('data-output-unit') || 'ft';
    
    // Map unit full names
    const unitNames = {
      'mi': 'Miles', 'ft': 'Feet', 'yd': 'Yards', 'km': 'Kilometers',
      'm': 'Meters', 'in': 'Inches', 'cm': 'Centimeters', 'nmi': 'Nautical Miles',
      'mph': 'Miles Per Hour', 'ft/s': 'Feet Per Second',
      'sq mi': 'Square Miles', 'sq ft': 'Square Feet'
    };
    inputName = unitNames[inputUnit] || 'Input';
    outputName = unitNames[outputUnit] || 'Output';
  }

  // 1. Math Flow Slider Diagram
  const flowSlider = document.getElementById('math-flow-slider');
  const flowMilesNode = document.getElementById('math-flow-miles');
  const flowFeetNode = document.getElementById('math-flow-feet');
  const flowFactorNode = document.getElementById('math-flow-factor');

  if (flowSlider && flowMilesNode && flowFeetNode) {
    const symbol = operation === 'multiply' ? '×' : '÷';
    if (flowFactorNode) {
      flowFactorNode.textContent = `${symbol} ${formatNumber(factor, factor < 0.1 ? 6 : (factor < 10 ? 4 : 0))}`;
    }

    const updateFlow = () => {
      const val = parseFloat(flowSlider.value);
      flowMilesNode.textContent = `${formatNumber(val, 1)} ${inputUnit}`;
      
      const result = operation === 'multiply' ? val * factor : val / factor;
      const decimals = result < 0.01 ? 6 : (result < 1 ? 4 : 2);
      flowFeetNode.textContent = `${formatNumber(result, decimals)} ${outputUnit}`;
    };
    flowSlider.addEventListener('input', updateFlow);
    updateFlow();
  }

  // 2. Tabbed Comparison Ruler Diagram
  const rulerBtnStatute = document.getElementById('ruler-btn-statute');
  const rulerBtnRoman = document.getElementById('ruler-btn-roman');
  const rulerBarFill = document.getElementById('ruler-bar-fill');
  const rulerMidLabel = document.getElementById('ruler-mid-label');
  const rulerEndLabel = document.getElementById('ruler-end-label');
  const rulerInfoText = document.getElementById('ruler-info-text');

  if (rulerBtnStatute && rulerBtnRoman && rulerBarFill) {
    // Dynamic configurations for Ruler
    let tab1Name = '1 Mile';
    let tab2Name = '1 Roman Mile';
    let tab1Width = '100%';
    let tab2Width = '94.7%';
    let tab1Mid = '4 Furlongs (2,640 ft)';
    let tab1End = '5,280 ft (8 Furlongs)';
    let tab2Mid = '500 Paces (2,500 ft)';
    let tab2End = '5,000 ft (1,000 Paces)';
    let tab1Info = 'Statute Mile: Established in 1593 to equal 8 furlongs. Equal to exactly 5,280 feet.';
    let tab2Info = 'Roman Mile (Mille Passus): Defined as one thousand paces. Equal to exactly 5,000 Roman feet.';

    if (inputUnit === 'mi' && outputUnit === 'ft') {
      tab1Name = t('ruler_tab1_name', tab1Name);
      tab2Name = t('ruler_tab2_name', tab2Name);
      tab1Mid = t('ruler_tab1_mid', tab1Mid);
      tab1End = t('ruler_tab1_end', tab1End);
      tab2Mid = t('ruler_tab2_mid', tab2Mid);
      tab2End = t('ruler_tab2_end', tab2End);
      tab1Info = t('ruler_tab1_info', tab1Info);
      tab2Info = t('ruler_tab2_info', tab2Info);
    }

    if (inputUnit === 'mi' && outputUnit === 'yd') {
      tab1Name = '1 Mile'; tab2Name = '1,760 Yards';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '0.5 Mile'; tab1End = '1 Mile (1,760 yd)';
      tab2Mid = '880 Yards'; tab2End = '1,760 Yards (1 mi)';
      tab1Info = '1 Mile = exactly 1,760 yards in standard imperial systems.';
      tab2Info = '1,760 Yards form exactly one standard statute mile.';
    } else if (inputUnit === 'mi' && outputUnit === 'km') {
      tab1Name = '1 Mile'; tab2Name = '1 Kilometer';
      tab1Width = '100%'; tab2Width = '62.1%';
      tab1Mid = '0.5 Mile (804m)'; tab1End = '1 Mile (1.609 km)';
      tab2Mid = '500 Meters'; tab2End = '1 Kilometer (0.621 mi)';
      tab1Info = '1 Mile = 1.60934 Kilometers. Standard international unit.';
      tab2Info = '1 Kilometer = 0.62137 Miles. Metric standard for geographic distance.';
    } else if (inputUnit === 'mi' && outputUnit === 'm') {
      tab1Name = '1 Mile'; tab2Name = '1,000 Meters';
      tab1Width = '100%'; tab2Width = '62.1%';
      tab1Mid = '804 Meters'; tab1End = '1 Mile (1,609.3m)';
      tab2Mid = '500 Meters'; tab2End = '1,000 Meters (0.621 mi)';
      tab1Info = '1 Mile = 1,609.344 Meters. Used globally for aviation and road mapping.';
      tab2Info = '1,000 Meters equals exactly 1 Kilometer, which is about 0.621 miles.';
    } else if (inputUnit === 'mi' && outputUnit === 'in') {
      tab1Name = '1 Mile'; tab2Name = '10,000 Inches';
      tab1Width = '100%'; tab2Width = '15.8%';
      tab1Mid = '31,680 Inches'; tab1End = '1 Mile (63,360 in)';
      tab2Mid = '5,000 Inches'; tab2End = '10,000 Inches (0.158 mi)';
      tab1Info = '1 Mile = 63,360 Inches. Extremely high ratio representing micro dimensions.';
      tab2Info = '10,000 Inches is equal to exactly 833.3 feet or 0.158 miles.';
    } else if (inputUnit === 'mi' && outputUnit === 'cm') {
      tab1Name = '1 Mile'; tab2Name = '100,000 cm';
      tab1Width = '100%'; tab2Width = '62.1%';
      tab1Mid = '80,467 cm'; tab1End = '1 Mile (160,934.4 cm)';
      tab2Mid = '50,000 cm'; tab2End = '100,000 cm (1 km or 0.621 mi)';
      tab1Info = '1 Mile = 160,934.4 Centimeters. Derived from converting miles to meters to cm.';
      tab2Info = '100,000 Centimeters equals exactly 1 Kilometer, which is 0.621 miles.';
    } else if (inputUnit === 'ft' && outputUnit === 'yd') {
      tab1Name = '3 Feet'; tab2Name = '1 Yard';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '1.5 Feet'; tab1End = '3 Feet (1 Yard)';
      tab2Mid = '0.5 Yard'; tab2End = '1 Yard (3 Feet)';
      tab1Info = '3 Feet is equal to exactly 1 yard.';
      tab2Info = '1 Yard is the imperial unit equal to exactly 3 feet.';
    } else if (inputUnit === 'ft' && outputUnit === 'in') {
      tab1Name = '1 Foot'; tab2Name = '12 Inches';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '6 Inches'; tab1End = '1 Foot (12 Inches)';
      tab2Mid = '6 Inches'; tab2End = '12 Inches (1 Foot)';
      tab1Info = '1 Foot is equal to exactly 12 inches.';
      tab2Info = '12 Inches standardizes to exactly 1 foot.';
    } else if (inputUnit === 'ft' && outputUnit === 'm') {
      tab1Name = '3.28 Feet'; tab2Name = '1 Meter';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '1.64 Feet'; tab1End = '3.28 Feet (1 Meter)';
      tab2Mid = '0.5 Meter'; tab2End = '1 Meter (3.28 Feet)';
      tab1Info = '3.28084 Feet equals 1 standard meter.';
      tab2Info = '1 Meter is the SI base unit of length, equal to about 3.28 feet.';
    } else if (inputUnit === 'ft' && outputUnit === 'cm') {
      tab1Name = '1 Foot'; tab2Name = '30.48 cm';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '15.24 cm'; tab1End = '1 Foot (30.48 cm)';
      tab2Mid = '15.24 cm'; tab2End = '30.48 cm (1 Foot)';
      tab1Info = '1 Foot = 30.48 Centimeters. Internationally standardized in 1959.';
      tab2Info = '30.48 Centimeters matches exactly one standard international foot.';
    } else if (inputUnit === 'nmi') {
      tab1Name = '1 Nautical Mile'; tab2Name = '1 Statute Mile';
      tab1Width = '100%'; tab2Width = '86.9%';
      tab1Mid = '3,038 Feet'; tab1End = '1 Nautical Mile (6,076 ft)';
      tab2Mid = '2,640 Feet'; tab2End = '1 Statute Mile (5,280 ft)';
      tab1Info = '1 Nautical Mile = 6,076.115 Feet. Based on Earth circumference minute of arc.';
      tab2Info = '1 Statute Mile = 5,280 Feet. Standard land measurement unit.';
    } else if (inputUnit === 'mph') {
      tab1Name = '60 MPH'; tab2Name = '88 ft/s';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '30 MPH'; tab1End = '60 MPH (88 ft/s)';
      tab2Mid = '44 ft/s'; tab2End = '88 ft/s (60 MPH)';
      tab1Info = '60 MPH converts to exactly 88 feet per second speed.';
      tab2Info = '88 feet per second is the highway speed equivalent to 60 MPH.';
    } else if (inputUnit === 'sq mi') {
      tab1Name = '1 Sq Mile'; tab2Name = '27,878,400 Sq Ft';
      tab1Width = '100%'; tab2Width = '100%';
      tab1Mid = '0.5 Sq Mile'; tab1End = '1 Sq Mile';
      tab2Mid = '13,939,200 Sq Ft'; tab2End = '27,878,400 Sq Ft';
      tab1Info = '1 Square Mile represents a geographic land grid of 5,280 ft x 5,280 ft.';
      tab2Info = '27.87M Square Feet equals exactly one square mile area.';
    }

    rulerBtnStatute.textContent = tab1Name;
    rulerBtnRoman.textContent = tab2Name;

    rulerBtnStatute.addEventListener('click', () => {
      rulerBtnRoman.classList.remove('active');
      rulerBtnStatute.classList.add('active');
      rulerBarFill.style.width = tab1Width;
      if (rulerMidLabel) rulerMidLabel.textContent = tab1Mid;
      if (rulerEndLabel) rulerEndLabel.textContent = tab1End;
      if (rulerInfoText) rulerInfoText.innerHTML = `<strong>${tab1Name}:</strong> ${tab1Info}`;
    });

    rulerBtnRoman.addEventListener('click', () => {
      rulerBtnStatute.classList.remove('active');
      rulerBtnRoman.classList.add('active');
      rulerBarFill.style.width = tab2Width;
      if (rulerMidLabel) rulerMidLabel.textContent = tab2Mid;
      if (rulerEndLabel) rulerEndLabel.textContent = tab2End;
      if (rulerInfoText) rulerInfoText.innerHTML = `<strong>${tab2Name}:</strong> ${tab2Info}`;
    });

    // Initial load info text
    if (rulerInfoText) rulerInfoText.innerHTML = `<strong>${tab1Name}:</strong> ${tab1Info}`;
    if (rulerMidLabel) rulerMidLabel.textContent = tab1Mid;
    if (rulerEndLabel) rulerEndLabel.textContent = tab1End;
  }

  // 3. Distance / Speed Scale Visualizer
  const scalePointer = document.getElementById('scale-indicator');
  const scaleInfoText = document.getElementById('scale-info-text');
  
  let markers = [
    { id: 'mark-track', left: '3.8%', icon: '🏃‍♂️', title: 'Standard 400m Lap', desc: 'About 1,320 feet. In miles, this is exactly 0.25 mi. 4 laps make a full mile!' },
    { id: 'mark-5k', left: '11.8%', icon: '🏅', title: 'The 5K Running Distance', desc: 'Equal to 16,404 feet. This is approximately 3.1 miles, a popular track & road running standard.' },
    { id: 'mark-altitude', left: '35%', icon: '✈️', title: 'Cruising Altitude', desc: 'Typically 35,000 feet for commercial passenger planes. In miles, this is exactly 6.63 miles above sea level.' },
    { id: 'mark-marathon', left: '98%', icon: '🏁', title: 'The Full Marathon', desc: 'An official marathon spans 26.2 miles. That requires runners to cross a massive distance of 138,435 feet!' }
  ];

  if (inputUnit === 'mi' && outputUnit === 'ft') {
    markers[0].title = t('scale_mark1_title', markers[0].title);
    markers[0].desc = t('scale_mark1_desc', markers[0].desc);
    markers[1].title = t('scale_mark2_title', markers[1].title);
    markers[1].desc = t('scale_mark2_desc', markers[1].desc);
    markers[2].title = t('scale_mark3_title', markers[2].title);
    markers[2].desc = t('scale_mark3_desc', markers[2].desc);
    markers[3].title = t('scale_mark4_title', markers[3].title);
    markers[3].desc = t('scale_mark4_desc', markers[3].desc);
  }

  if (inputUnit === 'mph') {
    markers = [
      { id: 'mark-track', left: '7.5%', icon: '🚶‍♂️', title: 'Walking Speed', desc: 'Typically 3 to 4 mph (4.4 to 5.9 ft/s). Easy walking pace.' },
      { id: 'mark-5k', left: '25%', icon: '🚴‍♀️', title: 'City Speed Limit', desc: 'Often 25 to 30 mph (36.7 to 44 ft/s) in residential areas.' },
      { id: 'mark-altitude', left: '65%', icon: '🚗', title: 'Highway Cruising', desc: 'Typically 65 to 70 mph (95.3 to 102.7 ft/s) on open freeways.' },
      { id: 'mark-marathon', left: '98%', icon: '🚄', title: 'Bullet Train', desc: 'High-speed rail reaches up to 200 mph (293.3 ft/s) or more!' }
    ];
  } else if (inputUnit === 'sq mi') {
    markers = [
      { id: 'mark-track', left: '3.8%', icon: '🏟️', title: 'Football Field', desc: 'About 57,600 square feet (approx. 0.002 square miles including end zones).' },
      { id: 'mark-5k', left: '25%', icon: '🌳', title: 'Central Park (NYC)', desc: 'Spans exactly 1.3 square miles, which is equal to 36,241,920 square feet.' },
      { id: 'mark-altitude', left: '55%', icon: '🇲🇨', title: 'Monaco', desc: 'The entire country of Monaco covers just 0.78 square miles (21.7M square feet).' },
      { id: 'mark-marathon', left: '98%', icon: '🏙️', title: 'Manhattan Island', desc: 'Manhattan covers approximately 22.8 square miles of total land area.' }
    ];
  }

  // Update label text of markers dynamically if DOM element exists
  const markerEl1 = document.getElementById('mark-track');
  const markerEl2 = document.getElementById('mark-5k');
  const markerEl3 = document.getElementById('mark-altitude');
  const markerEl4 = document.getElementById('mark-marathon');

  if (markerEl1) markerEl1.textContent = markers[0].title.split(' (')[0];
  if (markerEl2) markerEl2.textContent = markers[1].title.split(' (')[0];
  if (markerEl3) markerEl3.textContent = markers[2].title.split(' (')[0];
  if (markerEl4) markerEl4.textContent = markers[3].title.split(' (')[0];

  markers.forEach(marker => {
    const el = document.getElementById(marker.id);
    if (el && scalePointer && scaleInfoText) {
      el.addEventListener('click', () => {
        markers.forEach(m => {
          const btn = document.getElementById(m.id);
          if (btn) btn.classList.remove('active');
        });
        el.classList.add('active');
        scalePointer.style.left = marker.left;
        scaleInfoText.innerHTML = `<strong>${marker.title}:</strong> ${marker.desc}`;
        
        // Sync scale-dots active class
        document.querySelectorAll('.scale-dot').forEach(d => {
          if (d.getAttribute('data-target') === marker.id) {
            d.classList.add('active');
          } else {
            d.classList.remove('active');
          }
        });
      });
    }
  });

  // Handle dot clicks on the track to trigger label button clicks
  document.querySelectorAll('.scale-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const targetId = dot.getAttribute('data-target');
      const btn = document.getElementById(targetId);
      if (btn) btn.click();
    });
  });

  // Initial load details
  if (scaleInfoText && markers[0]) {
    scaleInfoText.innerHTML = `<strong>${markers[0].title}:</strong> ${markers[0].desc}`;
  }

});



