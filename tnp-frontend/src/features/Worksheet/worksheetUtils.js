import { initAllSizes } from "../../data/patternSize";

// for add or remove example quantity textfield
export function updateExamField(stateExQty, patternType, sizeName, qtyValue = null) {
    const quantity = (qtyValue === "" || Number(qtyValue) === 0) ? null : Number(qtyValue);
    const itemIndex = stateExQty.findIndex(item => item.ex_size_name === sizeName);
    const existItem = stateExQty.some((item) => item.ex_size_name === sizeName);
    const item = itemIndex !== -1 ? stateExQty[itemIndex] : { ex_pattern_type: patternType, ex_size_name: sizeName, ex_quantity: "" };

    if (quantity === null && existItem) {
      stateExQty.splice(itemIndex, 1);
  
    } else {
  
      if (existItem && itemIndex !== -1) {
        stateExQty[itemIndex] = item;
  
      } else if ( !existItem && quantity !== null) {
  
        stateExQty.push(item);
      }
    }

    return sortedExampleSizeName(stateExQty, sizeName);
  }

function sortedExampleSizeName(stateExQty, sizeName) {
  const patternType = sizeName.split("_")[0]

  if (patternType === 'unisex') {

    return stateExQty.sort((a, b) => {
      return (
        initAllSizes.indexOf(a.ex_size_name.toLowerCase()) -
        initAllSizes.indexOf(b.ex_size_name.toLowerCase())
      );
    });

  } else {

    return stateExQty.sort((a, b) => {
      const isMenA = a.ex_size_name.toLowerCase().startsWith('men_');
      const isMenB = b.ex_size_name.toLowerCase().startsWith('men_');
  
      if (isMenA !== isMenB) {
        // If one is men and the other is women, men comes first
        return isMenA ? -1 : 1;
      }

      // Extract size name after 'men_' prefix
      const sizeA = a.ex_size_name.replace(`${patternType}_`, '').toLowerCase();
      const sizeB = b.ex_size_name.replace(`${patternType}_`, '').toLowerCase();

      return initAllSizes.indexOf(sizeA) - initAllSizes.indexOf(sizeB);
    });

  }
}

// check have value in quantity each size.
export function checkShirtQty (stateExQty, shirt_qty_data) {
    let result = [];
    let data = [];

    if (shirt_qty_data?.men && shirt_qty_data?.women) {

      data = shirt_qty_data.men.concat(shirt_qty_data.women).map(item => {
          return {
            shirt_pattern_type: item.shirt_pattern_type,
            size_name: item.size_name,
            quantity: item.quantity
          }
      })
      
    } else {
      data = shirt_qty_data.map(item => {
          return {
            shirt_pattern_type: item.shirt_pattern_type,
            size_name: item.size_name,
            quantity: item.quantity
          }
      })
    }
  
    if (shirt_qty_data === null) {
      return result;
    }

    data.map((item) => {
      result = updateExamField(stateExQty, item.shirt_pattern_type, item.size_name, item.quantity)
    })
  
    return result;
  }
  
// sum all quantity
export function sumQty(input_arr) {
    let result = 0;

    if (input_arr === null) {
      return result;
    }
  
    const qty = input_arr.map(item => item.quantity);
  
    qty.forEach( num => {
      result += Number(num);
    })
  
    return result;
  }

// check how many new line in text.
export function chkStrNewLine(input) {
  let shirtDetail = '';
  let screenDetail = '';
  let shirtEachLine = 3;
  let screenEachLine = 3;

  if (typeof input === "object") {

    shirtDetail = input.shirt_detail;
    screenDetail = input.screen_detail;

    shirtEachLine = shirtDetail.split('\n');
    screenEachLine = screenDetail.split('\n');
  }

  return {
    "shirt_detail_len": shirtEachLine.length,
    "screen_detail_len": screenEachLine.length,
  }
}

export function changeSizeListSelect(pattern_type, stateShirtSize) {
  const getSizeNames = (sizes) => sizes.map(item => item.size_name);

  if (Number(pattern_type) === 2) {
    const existSizeMen = getSizeNames(stateShirtSize.men);
    const existSizeWomen = getSizeNames(stateShirtSize.women);

    // Find common sizes in both men and women
    const commonSizes = existSizeWomen.filter(item => existSizeMen.includes(item));

    // Find sizes in initAllSizes that are not in commonSizes
    return initAllSizes.filter(item => !commonSizes.includes(item));

  } else {
    const shirtSize = getSizeNames(stateShirtSize);

    // Find differences between shirtSize and initAllSizes
    const sizesNotInInit = shirtSize.filter(item => !initAllSizes.includes(item));
    const sizesNotInShirt = initAllSizes.filter(item => !shirtSize.includes(item));
    
    return [...sizesNotInInit, ...sizesNotInShirt];
  }

}

export function validateValue(props) {
  let result = "";

  if (!props.inputList.cus_id) {

    result = "กรุณาเลือกข้อมูลลูกค้า";
    
  } else if (Number(props.inputList.total_quantity) !== Number(props.sumQuantity.total)) {
    
    result = "โปรดตรวจสอบจำนวนเสื้อให้ถูกต้อง";
  }

  return result;
}
