import { createSignal, onCleanup, type Accessor, type Component, type JSX, type Setter } from "solid-js";
import { type CSSUnits, type CSSUnitsInput, toCSSUnits } from "../Types/CSSUnits";
import { type MouseButton } from "../Types/ValidInputs";

type Position = {
  x: CSSUnits;
  y: CSSUnits;
};

type Acions =
| { kind: "open" }
| { kind: "close" }
| { kind: "hold"; time: number};

type Chain = Acions[];

export class CMenuClass {
  private static instances: Record<string, CMenuClass> = {};

  private static set(id: string, instance: CMenuClass) {
    if (this.instances[id]) {
      throw new Error(`CMenu: id ${id} is already taken!`);
    };
    this.instances[id] = instance;
  };

  public static delete(id: string) {
    delete this.instances[id];
  };

  public static get(id: string): CMenuClass | undefined {
    if (!this.instances[id]) {
      console.warn(`CMenu: menu with id ${id} not found`);
    } else {
      return this.instances[id];
    };
  };

  private chain: Chain = [];
  private token: number = 0;

  private setVisible: Setter<boolean>;
  public getVisible: Accessor<boolean>;

  private setPosition: Setter<Position>;
  public getPosition: Accessor<Position>;

  constructor(id: string) {
    [this.getVisible, this.setVisible] = createSignal<boolean>(false);
    [this.getPosition, this.setPosition] = createSignal<Position>({x: "0px", y: "0px"});
    CMenuClass.set(id, this);
  };

  public open(x?: CSSUnitsInput, y?: CSSUnitsInput, overwrite: boolean = false): void {
    if (overwrite) this.token++;
    this.setPosition({x: toCSSUnits(x), y: toCSSUnits(y)});
    this.setVisible(true);
  };

  public close(overwrite: boolean = false): void {
    if (overwrite) this.token++;
    this.setVisible(false);
  };

  private hold(time: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, time));
  };  

  public openC(): this {
    this.chain.push({kind: "open"});
    return this;
  };

  public closeC(): this {
    this.chain.push({kind: "close"});
    return this;
  };

  public holdC(time: number): this {
    this.chain.push({kind: "hold", time: time});
    return this;
  };

  public clear(): this {
    this.chain = [];
    this.token++;
    return this;
  };

  private async executeC(x?: CSSUnitsInput, y?: CSSUnitsInput) {
    const token: number = ++this.token;
    for (const action of this.chain) {
      if (token !== this.token) break;
      switch (action.kind) {
        case "open":
          this.open(x, y);
          break;
        case "close":
          this.close();
          break;
        default:
          await this.hold(action.time);
        break;
      }
    };
  };

  public interact(event: MouseEvent, button: MouseButton) {
    if (button !== event.button) {
      this.close();
      return;
    };
    this.executeC(event.clientX, event.clientY);
  };

};

type Props = {
  id: string;
  pivot?: Position;
  children?: JSX.Element;
  style?: JSX.CSSProperties;
};

export const CMenu: Component<Props> = (props) => {

  const self = new CMenuClass(props.id);

  onCleanup(() => {
    CMenuClass.delete(props.id);
  });

  return (
    <div
    class="cmenu"
    id={`cmenu-${props.id}`}
    style={{
      ...props.style,
      position: "fixed",
      top: self.getPosition().y,
      left: self.getPosition().x,
      display: self.getVisible()? "block" : "none",
      transform: `translate(-${toCSSUnits(props.pivot?.x)}, -${toCSSUnits(props.pivot?.y)})`,
    }}
    >
      {props.children}
    </div>
  );
};