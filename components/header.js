class Header extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
        <script src="components/header.js" type="text/javascript" defer></script>
        <script src="components/slideshow.js" type="text/javascript" defer></script>

        <header>
          <nav>
          
            <div class="slideshow-container">
              <div class="mySlides fade">
                <img src="images/slideshow/slideshow-1.png" style="width:100%">
                <div class="text">Surf Zone</div>
              </div>
      
              <div class="mySlides fade">
                <img src="images/slideshow/slideshow-2.png" style="width:100%">
                <div class="text">Hydrology</div>
              </div>
      
              <div class="mySlides fade">
                <img src="images/slideshow/slideshow-3.png" style="width:100%">
                <div class="text">Mind Surfing</div>
              </div>

            </div>
            
            <div class="navbar">
                <a href="index.html">About</a>
                <a href="TeachingApps.html">Teaching Apps</a>
                <a href="DataTools.html">Data Viewer Tools</a>
                <a href="Publications.html">Publications</a>

            </div>

          </nav>
        </header>
        
      `;
    }
  }
  
  customElements.define('header-component', Header);