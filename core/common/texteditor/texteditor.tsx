// core/common/texteditor/texteditor.tsx

import React from 'react';

import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnBulletList,
  BtnNumberedList,
} from "react-simple-wysiwyg";

import DefaultEditor from "react-simple-wysiwyg";

const TextEditor = () => {
    const [values, setValue] = React.useState();
  
    function onChange(e:any) {
      setValue(e.target.value);
    }
  return (
    <div>
       <DefaultEditor value={values} onChange={onChange} />
    </div>
  )
}


export interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const TextEditorNew: React.FC<TextEditorProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  return (
    <EditorProvider>
      <Editor
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      >
        <Toolbar>
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <BtnBulletList />
          <BtnNumberedList />
        </Toolbar>
      </Editor>
    </EditorProvider>
  );
};

export default TextEditorNew;

/* const TextEditorNew: React.FC<TextEditorProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  return (
    <textarea
      className="w-full min-h-[120px] rounded border p-2 focus:ring-2 focus:ring-blue-500"
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter product description"
    />
  );
};


export default TextEditorNew; */
