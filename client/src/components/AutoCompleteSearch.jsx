// AutoCompleteSearch.jsx
import React, { useRef, useEffect, useState } from 'react';
import autoComplete from '@tarekraafat/autocomplete.js';
import '@tarekraafat/autocomplete.js/dist/css/autoComplete.01.css';
import '../styles/AutoComplete.css';

// This Component is an individual search bar that contians autocomplete for either allele_1 or allele_2 based on props passed
export default function AutoCompleteSearch({
  dataKey,      
  placeholder, 
  onSelect 
}) {
  const inputRef = useRef(null);
  const acInstance = useRef(null);
  const [dataset, setDataset] = useState([]);

    // Grab all the alleles from the dataset for autcomplete to compare against. Store in dataset.
    useEffect(() => {
        let isMounted = true;

        async function loadDataset() {
        try {
            const response = await fetch('http://localhost:3456/api/get_alleles');
            if (!response.ok) {
            throw new Error(`Failed to load alleles (status ${response.status})`);
            }
            const json = await response.json();
            if (!isMounted) return;
            const list = json[dataKey]
            setDataset(list);
        } catch (err) {
            console.error('AutoCompleteSearch fetch error:', err);
        }
        }

        loadDataset();

        return () => {
            isMounted = false;
        };
    }, [dataKey]);

    // Create the autocomplete object
    useEffect(() => {
        if (!dataset.length) return;

        // Assign a unique ID and destroy any prior instance
        const id = `autoComplete-${dataKey}`;
        inputRef.current.id = id;
        acInstance.current?.destroy();

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
        acInstance.current = null;
        };
    }, [dataset, dataKey, placeholder, onSelect]);

  return (
    <input
      type="search"
      ref={inputRef}
      className="my-autocomplete-input"
      placeholder={placeholder}
    />
  );
}
