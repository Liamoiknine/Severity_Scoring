import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import autoComplete from '@tarekraafat/autocomplete.js';
import '@tarekraafat/autocomplete.js/dist/css/autoComplete.01.css';
import '../styles/AutoComplete.css';

const AutoCompleteSearch = forwardRef(function AutoCompleteSearch({
  dataKey,
  placeholder,
  onSelect,
  a1_value
}, ref) {
  const inputRef = useRef(null);
  const acInstance = useRef(null);
  const [dataset, setDataset] = useState([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }));

  useEffect(() => {
    let isMounted = true;

    async function loadDataset() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_alleles`);
        if (!response.ok) throw new Error(`Failed to load alleles`);

        const list = await response.json(); // list of { allele_1, allele_2 }
        if (!isMounted) return;

        if (dataKey === 'allele_1') {
          const a1List = list.map(item => item.allele_1);
          setDataset(a1List);
        } else {
          if (!a1_value) {
            setDataset([]);
            return;
          }

          const a2List = list
            .filter(item => item.allele_1 === a1_value && item.allele_2)
            .map(item => item.allele_2);

          setDataset(a2List);
        }
      } catch (err) {
        console.error('AutoCompleteSearch fetch error:', err);
      }
    }

    loadDataset();
    return () => {
      isMounted = false;
    };
  }, [dataKey, a1_value]);

  useEffect(() => {
    if (!dataset.length) return;

    const id = `autoComplete-${dataKey}`;
    inputRef.current.id = id;

    // Proper cleanup to avoid DOM mutation errors
    try {
      acInstance.current?.unInit?.();
      acInstance.current?.destroy?.();
    } catch (e) {
      console.warn('AutoComplete cleanup failed:', e);
    }

    acInstance.current = new autoComplete({
      selector: `#${id}`,
      placeHolder: placeholder,
      data: { src: dataset, cache: true },
      resultItem: { highlight: true },
      events: {
        input: {
          selection: ({ detail }) => {
            const value = detail.selection.value;
            inputRef.current.value = value;
            onSelect?.(value);
          }
        }
      }
    });

    return () => {
      try {
        acInstance.current?.unInit?.();
        acInstance.current?.destroy?.();
      } catch (e) {
        console.warn('AutoComplete cleanup error:', e);
      }
      acInstance.current = null;
    };
  }, [dataset, dataKey, placeholder, onSelect]);

  return (
    <div className="autocomplete-wrapper">
      <input
        type="search"
        ref={inputRef}
        className="my-autocomplete-input"
        placeholder={placeholder}
      />
    </div>
  );
});

export default AutoCompleteSearch;
