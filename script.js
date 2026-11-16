// Llena el campo oculto "origen" con el parámetro ?ref= de la URL.
(function () {
  var ref = new URLSearchParams(location.search).get("ref");
  if (!ref) return;
  document.querySelectorAll('input[name="origen"]').forEach(function (campo) {
    campo.value = ref;
  });
})();

// Animaciones al hacer scroll (reveals con stagger + contadores).
(function () {
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var cuentaHecha = new WeakSet();
  function contar(el) {
    if (cuentaHecha.has(el) || reduceMotion) return;
    cuentaHecha.add(el);
    var fin = parseInt(el.dataset.contar, 10);
    var desde = parseInt(el.dataset.desde || "0", 10);
    var sufijo = el.dataset.sufijo || "";
    var duracion = 1100;
    var inicio = null;
    function paso(t) {
      if (!inicio) inicio = t;
      var p = Math.min((t - inicio) / duracion, 1);
      var suave = 1 - Math.pow(1 - p, 3); // ease-out
      var valor = Math.round(desde + (fin - desde) * suave);
      el.textContent = valor + sufijo;
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("revelado"); });
    document.querySelectorAll("[data-contar]").forEach(function (el) {
      el.textContent = el.dataset.contar + (el.dataset.sufijo || "");
    });
    return;
  }

  // Stagger: los elementos hermanos que entran juntos se retrasan en cascada.
  var porPadre = new Map();
  reveals.forEach(function (el) {
    var padre = el.parentElement;
    var n = porPadre.get(padre) || 0;
    el.style.setProperty("--retraso", (n * 0.1) + "s");
    porPadre.set(padre, n + 1);
  });

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("revelado");
      e.target.querySelectorAll("[data-contar]").forEach(contar);
      if (e.target.hasAttribute("data-contar")) contar(e.target);
      observador.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });

  reveals.forEach(function (el) { observador.observe(el); });
})();

// Calculadora: al elegir horas de reels, responde cuántos días del año son.
(function () {
  var dias = {
    "menos de 1": { d: 11, frase: "Son <strong>11 días</strong> de tu año. Pocos, pero tuyos." },
    "1 a 2": { d: 23, frase: "Son <strong>23 días completos</strong> de tu año. Casi un mes." },
    "2 a 4": { d: 45, frase: "Son <strong>45 días completos</strong> de tu año. ¿Te los devuelvo?" },
    "más de 4": { d: 68, frase: "Son <strong>más de 68 días</strong> de tu año. Dos meses enteros." }
  };
  document.querySelectorAll('select[name="horas"]').forEach(function (sel) {
    var salida = sel.parentElement.querySelector("[data-calculo]");
    if (!salida) return;
    sel.addEventListener("change", function () {
      var info = dias[sel.value];
      if (!info) return;
      salida.innerHTML = info.frase;
      salida.classList.remove("visible");
      void salida.offsetWidth; // reinicia la animación
      salida.classList.add("visible");
    });
  });
})();

// Contador en vivo: tiempo en la página → reels equivalentes (~20 s por reel).
(function () {
  var tiempoEl = document.querySelector("[data-tiempo]");
  var reelsEl = document.querySelector("[data-reels]");
  if (!tiempoEl || !reelsEl) return;
  var inicio = Date.now();
  setInterval(function () {
    var s = Math.floor((Date.now() - inicio) / 1000);
    var m = Math.floor(s / 60);
    tiempoEl.textContent = m + ":" + String(s % 60).padStart(2, "0");
    reelsEl.textContent = Math.floor(s / 20);
  }, 1000);
})();

// Conteo de la lista: pon el número real en data-conteo y aparece solo.
(function () {
  var el = document.querySelector("[data-conteo]");
  if (!el) return;
  var n = parseInt(el.dataset.conteo, 10);
  if (!n || n < 1) return; // sin número real, no se muestra nada
  el.querySelector("strong").textContent = n.toLocaleString("es-CO");
  el.hidden = false;
})();

// El teléfono responde al scroll: bajar = swipear reels, luego el feed limpio
// scrollea hasta "Estás al día". En reposo vuelve a la animación automática.
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var telefono = document.querySelector(".telefono");
  var hero = document.querySelector(".hero");
  if (!telefono || !hero) return;

  var objetivo = 0, actual = 0, animando = false;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  function aplicar(p) {
    // el scroll de la página recorre los 5 reels (el 6to es igual al 1ro)
    telefono.style.setProperty("--reel-y", (-p * 500) + "%");
  }

  function cuadro() {
    actual += (objetivo - actual) * 0.14; // suavizado
    aplicar(actual);
    if (Math.abs(objetivo - actual) > 0.001) {
      requestAnimationFrame(cuadro);
    } else {
      animando = false;
    }
  }

  function alScroll() {
    var y = window.scrollY;
    if (y < 5) {
      // arriba del todo: vuelve la animación automática
      telefono.classList.remove("telefono--scroll");
      actual = 0; objetivo = 0;
      return;
    }
    telefono.classList.add("telefono--scroll");
    var rango = hero.offsetHeight * 0.85;
    objetivo = clamp(y / rango);
    if (!animando) { animando = true; requestAnimationFrame(cuadro); }
  }

  addEventListener("scroll", alScroll, { passive: true });
  alScroll();
})();
