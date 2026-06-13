// RHFSelect.tsx

import Select from "react-select";
import { Controller } from "react-hook-form";

type Option = {
  value: number | string;
  label: string;
};

type Props = {
  name: string;
  control: any;
  options: Option[];
  isMulti?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
};

export default function RHFSelect({
  name,
  control,
  options,
  isMulti = false,
  isDisabled = false,
  placeholder = '',
}: Props) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const getValue = () => {
          if (isMulti) {
            return options.filter((o) => field.value?.includes(o.value));
          }
          return options.find((o) => o.value === field.value) || null;
        };

        return (
          <Select
            options={options}
            value={getValue()}
            isMulti={isMulti}
            isDisabled={isDisabled}
            placeholder={placeholder || "Select..."}
            onChange={(val: any) => {
              if (isMulti) {
                field.onChange(val?.map((v: any) => v.value) || []);
              } else {
                field.onChange(val ? val.value : null);
              }
            }}
          />
        );
      }}
    />
  );
}