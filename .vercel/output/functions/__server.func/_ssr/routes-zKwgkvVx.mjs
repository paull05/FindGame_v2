import { i as __toESM } from "../_runtime.mjs";
import { I as require_jsx_runtime, L as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-zKwgkvVx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const [View, setView] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		import("./GameView-BwtLtSm-.mjs").then((m) => setView(() => m.GameView));
	}, []);
	if (!View) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bakuran-loader",
		"aria-live": "polite",
		"aria-busy": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bakuran-loader__backdrop",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bakuran-loader__panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bakuran-loader__eyebrow",
					children: "Naiwan. Hanapin."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Bakuran" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bakuran-loader__body",
					children: "Preparing the grounds…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bakuran-loader__bar",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, {});
}
//#endregion
export { Home as component };
