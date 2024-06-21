import * as React from "react";
import type { ClassicPreset } from "rete";
import styled from "styled-components";

import { $socketcolor, $socketmargin, $socketsize } from "./vars";
import { assignColor } from "../utils";
import type { Socket } from "../../socket/Socket";

interface StylesProps {
  background: string;
}

const Styles = styled.div<StylesProps>`
  display: inline-block;
  cursor: pointer;
  border: 1px solid white;
  border-radius: ${$socketsize / 2.0}px;
  width: ${$socketsize}px;
  height: ${$socketsize}px;
  vertical-align: middle;
  background: ${(props) => props.background};
  z-index: 2;
  box-sizing: border-box;
  &:hover {
    border-width: 4px;
  }
  &.multiple {
    border-color: yellow;
  }
`;

const Hoverable = styled.div`
  border-radius: ${($socketsize + $socketmargin * 2) / 2.0}px;
  padding: ${$socketmargin}px;
  &:hover ${Styles} {
    border-width: 4px;
  }
`;

const RequiredStyles = styled(Styles)`
  background: #b38a8a;
`;

const StringStyles = styled(Styles)`
  background: #b3799d;
`;

export function CustomClassicSocket<T extends Socket>(props: { data: T }) {
  return (
    <Hoverable>
      <Styles
        title={props.data.value ? String(props.data.value) : props.data.name}
        background={assignColor(props.data)}
      />
    </Hoverable>
  );
}
