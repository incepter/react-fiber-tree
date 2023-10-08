import * as React from "react";

export default function DevApp() {
  return (
    <div style={{ display: "flex" }}>
      <span>Hi ! {Date.now()}</span>
      <T>
        <T2>
          <T3>
            <T4>
              <Inner
                toto={5}
                titi={3}
                tata={4}
                fifi={2}
                fofo={3}
                initialText={"Hello World !"}
              />
            </T4>
          </T3>
        </T2>
      </T>
      {/*<T>*/}
      {/*  <T2>*/}
      {/*    <T3>*/}
      {/*      <T4>*/}
      {/*        <Inner*/}
      {/*          toto={5}*/}
      {/*          titi={3}*/}
      {/*          tata={4}*/}
      {/*          fifi={2}*/}
      {/*          fofo={3}*/}
      {/*          initialText={"Hello World !"}*/}
      {/*        />*/}
      {/*      </T4>*/}
      {/*    </T3>*/}
      {/*  </T2>*/}
      {/*</T>*/}
      {/*<T>*/}
      {/*  <T2>*/}
      {/*    <T3>*/}
      {/*      <T4>*/}
      {/*        <Inner*/}
      {/*          toto={5}*/}
      {/*          titi={3}*/}
      {/*          tata={4}*/}
      {/*          fifi={2}*/}
      {/*          fofo={3}*/}
      {/*          initialText={"Hello World !"}*/}
      {/*        />*/}
      {/*      </T4>*/}
      {/*    </T3>*/}
      {/*  </T2>*/}
      {/*</T>*/}
    </div>
  );
}

function T({ children }) {
  return children;
}

function T2({ children }) {
  return children;
}

function T3({ children }) {
  return children;
}

function T4({ children }) {
  return children;
}

function Inner({ initialText, toto, titi, tata, fifi, fofo }) {
  let [state, setState] = React.useState(initialText);

  return (
    <div>
      <div>
        <div>
          <div>
            <input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <article>
          <summary>
            <span>
              <label>OKOK</label>
            </span>
          </summary>
        </article>
      </div>
      <span>Haaa !!</span>
      <p>OK::</p>
      <p>OK::</p>
      <p>OK::</p>
      <p>
        <div>OK ko</div>
      </p>
      <p>OK::</p>
    </div>
  );
}
