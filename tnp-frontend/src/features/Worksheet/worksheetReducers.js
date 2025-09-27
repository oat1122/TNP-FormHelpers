import { initSizes, initExtraSizes, initAllSizes } from "./../../data/patternSize";
import { onlyNums } from "../../utils/inputFormatters";
import { updateExamField, checkShirtQty, sumQty, changeSizeListSelect } from "./worksheetUtils";

const sortedPatternSizeName = (statePatternSizes) => {
  return statePatternSizes.sort((a, b) => {
    return (
      initAllSizes.indexOf(a.size_name.toLowerCase()) -
      initAllSizes.indexOf(b.size_name.toLowerCase())
    );
  });
};

export default {
  setItemList: (state, action) => {
    const { data } = action.payload;
    state.item_list = data;
  },
  setItem: (state, action) => {
    const { pattern_type, pattern_sizes } = action.payload;
    let updatedExampleQty = [];
    state.inputList = action.payload;
    state.extraSizes = changeSizeListSelect(pattern_type, pattern_sizes);

    if (Number(pattern_type) === 2) {
      state.sumQuantity.men = sumQty(pattern_sizes["men"]);
      state.sumQuantity.women = sumQty(pattern_sizes["women"]);
      state.sumQuantity.total = (state.sumQuantity.men || 0) + (state.sumQuantity.women || 0);

      updatedExampleQty = ["men", "women"].reduce((acc, type) => {
        acc[type] = checkShirtQty(
          [...state.inputList.example_quantity[type]],
          action.payload.pattern_sizes[type]
        );
        return acc;
      }, {});
    } else {
      state.sumQuantity.total = sumQty(pattern_sizes);
      updatedExampleQty = checkShirtQty(
        [...state.inputList.example_quantity],
        action.payload.pattern_sizes
      );
    }

    state.inputList = {
      ...state.inputList,
      example_quantity: updatedExampleQty,
    };
  },
  setCustomerList: (state, action) => {
    const { data } = action.payload;
    state.customerList = data;
  },
  setCustomerSelected: (state, action) => {
    const selectedCustomer = state.customerList.find((item) => item.cus_id === action.payload);

    state.inputList = {
      ...state.inputList,
      cus_id: selectedCustomer.cus_id,
      cus_name: selectedCustomer.cus_name,
      cus_company: selectedCustomer.cus_company,
      cus_address: selectedCustomer.cus_address,
      cus_tel_1: selectedCustomer.cus_tel_1,
      cus_email: selectedCustomer.cus_email,
    };
  },
  setInputList: (state, action) => {
    const { name, value, index } = action.payload;

    if (index !== null) {
      if (name.startsWith("exam") || name.startsWith("embroider")) {
        const keyName = name.startsWith("exam") ? "example_quantity" : "polo_embroider";
        const updatedInputList = [...state.inputList[keyName]];

        if (name.startsWith("exam")) {
          updatedInputList[index].ex_quantity = onlyNums(value);
        } else {
          updatedInputList[index][name] = value;
        }

        state.inputList = {
          ...state.inputList,
          [keyName]: updatedInputList,
        };
      } else {
        const updatedInputList = [...state.inputList[name]];
        updatedInputList[index] = value;
        state.inputList = {
          ...state.inputList,
          [name]: updatedInputList,
        };
      }
    } else if (
      (name.startsWith("screen") && name !== "screen_detail") ||
      name === "total_quantity"
    ) {
      state.inputList = {
        ...state.inputList,
        [name]: onlyNums(value),
      };
    } else {
      state.inputList = {
        ...state.inputList,
        [name]: value,
      };
    }
  },
  setDateInput: (state, action) => {
    const { value, is_due_date } = action.payload;
    const name = is_due_date ? "due_date" : "exam_date";

    state.inputList = {
      ...state.inputList,
      [name]: value,
    };
  },
  setRadioSelect: (state, action) => {
    state.inputList = {
      ...state.inputList,
      crewneck_selected: Number(action.payload),
    };
  },
  setExtraSizes: (state, action) => {
    state.extraSizes = action.payload;
  },
  setPoloChecked: (state, action) => {
    const { name, checked } = action.payload;
    state.inputList[name] = checked;
  },
  setUserList: (state, action) => {
    const { data } = action.payload;
    state.creatorList = data.graphic_role;
  },
  setIsDuplicate: (state, action) => {
    state.inputList = {
      ...state.inputList,
      is_duplicate: action.payload,
    };
  },
  setErrorMsg: (state, action) => {
    state.errorMsg = action.payload;
  },
  setInputPattern: (state, action) => {
    const { name, value, index = null } = action.payload;
    const isPatternSizes = [
      "pattern_sizes",
      "unisex",
      "men",
      "women",
      "chest",
      "long",
      "quantity",
    ].some((prefix) => name.startsWith(prefix));
    const [patternType, fieldName] = name.split("_");
    let patternSizesState = state.inputList.pattern_sizes;
    let examQtyState;

    if (patternType === "men" || patternType === "women") {
      patternSizesState = state.inputList.pattern_sizes[patternType];
    }

    if (isPatternSizes) {
      if (fieldName === "quantity") {
        patternSizesState[index][fieldName] = onlyNums(value);

        const sizeName = name.split("_")[2];
        const patternTypeMap = {
          unisex: 1,
          men: 2,
          women: 3,
        };

        if (patternType === "men" || patternType === "women") {
          state.sumQuantity[patternType] = sumQty(patternSizesState);
          state.sumQuantity.total = (state.sumQuantity.men || 0) + (state.sumQuantity.women || 0);

          examQtyState = updateExamField(
            [...state.inputList.example_quantity[patternType]],
            patternTypeMap[patternType],
            sizeName,
            onlyNums(value)
          );

          state.inputList = {
            ...state.inputList,
            example_quantity: {
              ...state.inputList.example_quantity,
              [patternType]: examQtyState,
            },
          };
        } else {
          state.sumQuantity.total = sumQty(patternSizesState);
          examQtyState = updateExamField(
            [...state.inputList.example_quantity],
            patternTypeMap[patternType],
            sizeName,
            onlyNums(value)
          );

          state.inputList = {
            ...state.inputList,
            example_quantity: examQtyState,
          };
        }
      } else if (name === "pattern_sizes") {
        state.inputList.pattern_sizes = value;
        state.extraSizes = changeSizeListSelect(state.inputList.pattern_type, value);
      } else {
        if (value === "" || /(^[0-9]{1,3})+(\.[0-9]{0,2})?$/.test(value)) {
          patternSizesState[index][fieldName] = value === "" ? "" : Number(value);
        }
      }
    } else if (name === "pattern_type") {
      const patternSizes = value === "2" ? { men: initSizes, women: initSizes } : initSizes;
      const exampleQty = value === "2" ? { men: [], women: [] } : [];

      state.inputList = {
        ...state.inputList,
        pattern_type: Number(value),
        pattern_sizes: patternSizes,
        example_quantity: exampleQty,
      };
      state.sumQuantity = { total: "", men: "", women: "" };
      state.extraSizes = initExtraSizes;
    } else {
      state.inputList = {
        ...state.inputList,
        [name]: value,
      };
    }
  },
  setInputExample: (state, action) => {
    const { name, value, index } = action.payload;
    const [patternType, fieldName] = name.split("_");
    let exampleQtyState = state.inputList.example_quantity;

    if (patternType === "men" || patternType === "women") {
      exampleQtyState = state.inputList.example_quantity[patternType];
    }

    exampleQtyState[index].ex_quantity = onlyNums(value);
  },
  resetInputList: (state) => {
    state.inputList = {
      user_id: "",
      work_name: "",
      work_id: "",
      total_quantity: "",
      due_date: null,
      cus_id: "",
      cus_name: "",
      cus_company: "",
      cus_address: "",
      cus_tel_1: "",
      cus_email: "",
      fabric_name: "",
      fabric_no: "",
      fabric_color: "",
      fabric_color_no: "",
      fabric_factory: "",
      crewneck_selected: 0,
      crewneck_color: "",
      fabric_custom_color: [],
      pattern_name: "",
      pattern_gender: "unisex",
      pattern_type: 1,
      pattern_sizes: initSizes,
      screen_point: "",
      screen_flex: "",
      screen_dft: "",
      screen_label: "",
      screen_embroider: "",
      screen_detail: "",
      exam_date: null,
      example_quantity: [],
      worksheet_note: "",
      type_shirt: "t-shirt",
      size_tag: "",
      packaging: "",
      shirt_detail: "",
      collar: 1,
      collar_type: 1,
      other_collar_type: "",
      collar_type_detail: "",
      placket: 1,
      other_placket: "",
      outer_placket: false,
      outer_placket_detail: "",
      inner_placket: false,
      inner_placket_detail: "",
      button: 1,
      other_button: "",
      button_color: "",
      sleeve: 1,
      sleeve_detail: "",
      pocket: 1,
      pocket_detail: "",
      bottom_hem: false,
      bottom_hem_detail: "",
      back_seam: false,
      back_seam_detail: "",
      side_vents: false,
      side_vents_detail: "",
      polo_embroider: [{ embroider_position: 1, embroider_size: "" }],
      creator_name: "",
      manager_name: "",
      production_name: "",
      nws_created_date: null,
      nws_created_by: "",
      nws_updated_date: null,
      nws_updated_by: "",
      images: "",
      is_duplicate: false,
    };
    state.sumQuantity = { total: "", men: "", women: "" };
    state.extraSizes = initExtraSizes;
  },
  addRowFabricCustomColor: (state) => {
    state.inputList.fabric_custom_color.push("");
  },
  deleteRowFabricCustomColor: (state, action) => {
    state.inputList.fabric_custom_color.splice(action.payload, 1);
  },
  addRowPoloEmbroider: (state) => {
    state.inputList.polo_embroider.push({ embroider_position: 1, embroider_size: "" });
  },
  deleteRowPoloEmbroider: (state, action) => {
    state.inputList.polo_embroider.splice(action.payload, 1);
  },
  addExtraSize: (state, action) => {
    const newSize = { size_name: action.payload, chest: "", long: "", quantity: "" };

    if (Number(state.inputList.pattern_type) === 2) {
      ["men", "women"].forEach((type) => {
        const sizeExist = state.inputList.pattern_sizes[type].some(
          (item) => item.size_name === action.payload
        );

        if (!sizeExist) {
          const updatedPattern = [...state.inputList.pattern_sizes[type], newSize];
          state.inputList.pattern_sizes[type] = sortedPatternSizeName(updatedPattern);
        }
      });
    } else {
      const updatedPatternSizes = [...state.inputList.pattern_sizes, newSize];
      state.inputList.pattern_sizes = sortedPatternSizeName(updatedPatternSizes);
    }
  },
  deleteRowPatternSize: (state, action) => {
    const { index, pattern_type, size_name } = action.payload;
    let patternSizeState = state.inputList.pattern_sizes;
    let examQtyState;

    if (pattern_type === "men" || pattern_type === "women") {
      state.inputList.pattern_sizes[pattern_type].splice(index, 1);
      patternSizeState = state.inputList.pattern_sizes[pattern_type];
      state.sumQuantity[pattern_type] = sumQty(state.inputList.pattern_sizes[pattern_type]);
      state.sumQuantity.total = (state.sumQuantity.men || 0) + (state.sumQuantity.women || 0);

      examQtyState = updateExamField(
        [...state.inputList.example_quantity[pattern_type]],
        pattern_type,
        size_name
      );

      state.inputList = {
        ...state.inputList,
        example_quantity: {
          ...state.inputList.example_quantity,
          [pattern_type]: examQtyState,
        },
      };
    } else {
      state.inputList.pattern_sizes.splice(index, 1);
      state.sumQuantity.total = sumQty(patternSizeState);

      examQtyState = updateExamField(
        [...state.inputList.example_quantity],
        pattern_type,
        size_name
      );

      state.inputList = {
        ...state.inputList,
        example_quantity: examQtyState,
      };
    }

    const sizeExist = state.extraSizes.some((item) => item === size_name);

    if (!sizeExist) {
      state.extraSizes = [...state.extraSizes, size_name].sort(
        (a, b) => initAllSizes.indexOf(a.toLowerCase()) - initAllSizes.indexOf(b.toLowerCase())
      );
    }
  },
};
