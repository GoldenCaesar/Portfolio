import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}


<div class="overlay"></div><div class="scanline"></div> <section class="screen"><div class="" id="loading" style="overflow-y: auto;"></div><div class="hide" id="allContent"><div class="wrapper"><div class="content clearfix"> <header class="site clearfix"><div class="col one"><p>Demicube, INC</p> <img src="assets/demicube.png" width="740" height="729" id="logo-v" /></div><div class="col two"><h4>Demicube, INC (tm) <br /> <b>H</b>ash <b>E</b>ncrypted <b>R</b>eal-Time <b>O</b>perating <b>S</b>ystem (HEROS)</h4><p>----------------------------------------</p><p>HEROS v 1.0.0</p><p>(c)2021 Demicube</p><p>- CONNECTED -</p><br/><p>System Developer(s) (SYSDEVS) - S. Miller</p><p>Full Stack(s) (WEBDEVS) - A. Mitchell</p><p>Cascading Styler Inspired by M. Richardson</p></div> </header><p class="clear"><br /></p><p>Welcome to the Hash Encrypted Real-Time Operating System (HEROS). <br/>Fill out the fields below to Encrypt or Decrypt your data. There is no way to recover encrypted data without the password, and there is no password recovery. Version or algorithm change may render encrypted data lost. Goodluck.</p><br /><div class="goodLuck"><div class="" id="nCode"><h1>Encode or Decode your string</h1> <label class="encodeLabel">String to Encode</label><textarea class="textEncodeInput" id="str" type="text" style="border-bottom: solid; margin-bottom: 1em;"></textarea><label class="passwordLabel">Password</label> <input class="passwordEncodeInput" id="pass" type="text" style="border-bottom: solid; margin-bottom: 1em;"/> <button id="encodeButton">Encode</button> <button id="decodeButton">Decode</button> <br/> <button id="copyBtn">Copy to clipboard</button> <button id="clearBtn">Clear</button><h3>Result:</h3> <br/><textarea class="result" id=""></textarea></div></div></div></div></div> </section>
    

    </div>
    
  );
}

export default App;
