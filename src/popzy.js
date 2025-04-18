Popzy.modalList = [];

function Popzy(options = {}) {
	if (!options.content && !options.templateId) {
		console.error("You must provide one of 'content' or 'templateId'");

		return;
	}

	if (options.content && options.templateId) {
		options.templateId = null;
		console.warn(
			"Both 'content' and 'templateId' are specified. 'content will take precedence' and 'templateId ' will be ignored "
		);
	}

	if (options.templateId) {
		this._templateElement = document.querySelector(
			`#${options.templateId}`
		);
		if (!this._templateElement) {
			console.error(`#${options.templateId} does not exist`);
			return;
		}
	}

	this.opt = Object.assign(
		{
			enableScrollLock: true,
			destroyOnClose: true,
			cssClass: [],
			footer: false,
			closeMethod: ["button", "overlay", "escape"],
			scrollLockTarget: () => document.body,
		},
		options
	);

	this.content = this.opt.content;
	this._buttonList = [];
}

Popzy.prototype._handleScrollbar = function () {
	if (this._handleScrollbar.value) return this._handleScrollbar.value;

	const div = document.createElement("div");

	Object.assign(div.style, {
		overflow: "scroll",
		position: "absolute",
		top: "-9999px",
	});

	document.body.append(div);

	this._handleScrollbar.value = div.offsetWidth - div.clientWidth;

	return this._handleScrollbar.value;
};

Popzy.prototype._build = function () {
	const contentNode = this.content
		? document.createElement("div")
		: this._templateElement.content.cloneNode(true);

	if (this.content) {
		contentNode.innerHTML = this.content;
	}

	const { closeMethod } = this.opt;
	this._closeButtonMethod = closeMethod.includes("button");
	this._closeOverlayMethod = closeMethod.includes("overlay");
	this._closeEscapeMethod = closeMethod.includes("escape");

	this._backdrop = document.createElement("div");
	this._backdrop.classList.add("popzy__backdrop");

	const container = document.createElement("div");
	container.classList.add("popzy__container");

	this._modalContent = document.createElement("div");
	this._modalContent.classList.add("popzy__content");
	this._modalContent.append(contentNode);

	this.opt.cssClass.forEach((className) => {
		if (typeof className === "string") {
			container.classList.add(className);
		}
	});

	if (this._closeButtonMethod) {
		const closeButton = this._createButton(
			"&times;",
			"popzy__close",
			() => {
				this.close();
			}
		);

		container.append(closeButton);
	}

	container.append(this._modalContent);

	if (this.opt.footer) {
		this._footer = document.createElement("div");
		this._footer.classList.add("popzy__footer");

		if (this._footerContent) {
			this._footer.innerHTML = this._footerContent;
		}

		this._buttonList.forEach((btn) => {
			this._footer.append(btn);
		});

		container.append(this._footer);
	}

	this._backdrop.append(container);
	document.body.append(this._backdrop);

	if (this._closeOverlayMethod) {
		this._backdrop.onclick = (e) => {
			if (e.target === this._backdrop) {
				this.close();
			}
		};
	}
};

Popzy.prototype._hasScrollbar = function (target) {
	if ([document.documentElement, document.body].includes(target)) {
		return (
			document.documentElement.scrollHeight >
				document.documentElement.clientHeight ||
			document.body.scrollHeight > document.body.clientHeight
		);
	}

	return target.scrollHeight > target.clientHeight;
};

Popzy.prototype._handleEscapeKey = function (e) {
	const lastModalList = Popzy.modalList[Popzy.modalList.length - 1];
	if (e.key === "Escape" && this === lastModalList) {
		this.close();
	}
};

Popzy.prototype.setContent = function (content) {
	this.content = content;

	if (this._modalContent) {
		this._modalContent.innerHTML = this.content;
	}
};

Popzy.prototype.setFooterContent = function (content) {
	this._footerContent = content;

	if (this._footer) {
		this._footer.innerHTML = this._footerContent;
	}
};

Popzy.prototype.addFooterButton = function (title, cssClass, callback) {
	const btn = this._createButton(title, cssClass, callback);
	this._buttonList.push(btn);

	if (this._footer) {
		this._buttonList.forEach((btn) => {
			this._footer.append(btn);
		});
	}
};

Popzy.prototype._createButton = function (title, cssClass, callback) {
	const button = document.createElement("button");
	button.innerHTML = title;
	button.className = cssClass;
	button.onclick = callback;

	return button;
};

Popzy.prototype.open = function () {
	Popzy.modalList.push(this);

	if (!this._backdrop) {
		this._build();
	}

	setTimeout(() => {
		this._backdrop.classList.add("popzy--show");
	}, 0);

	if (this._closeEscapeMethod) {
		this._handleEscapeKey = this._handleEscapeKey.bind(this);
		document.addEventListener("keydown", this._handleEscapeKey);
	}

	// Add no-scroll and paddingRight in body
	if (Popzy.modalList.length === 1 && this.opt.enableScrollLock) {
		const target = this.opt.scrollLockTarget();
		if (this._hasScrollbar(target)) {
			target.classList.add("popzy--no-scroll");
			const targetPadRight = parseInt(
				getComputedStyle(target).paddingRight
			);

			target.style.paddingRight =
				targetPadRight + this._handleScrollbar() + "px";
		}
	}
	this._onTransitionEnd(this.opt.onOpen);
	return this._backdrop;
};

Popzy.prototype._onTransitionEnd = function (callback) {
	this._backdrop.ontransitionend = (e) => {
		if (e.propertyName !== "opacity") return;
		if (typeof callback === "function") callback();
	};
};

Popzy.prototype.close = function (destroy = this.opt.destroyOnClose) {
	Popzy.modalList.pop();
	this._backdrop.classList.remove("popzy--show");
	document.removeEventListener("keydown", this._handleEscapeKey);

	this._onTransitionEnd(() => {
		if (destroy) {
			this._backdrop.remove();
			this._backdrop = null;
			this._footerContent = null;
		}
		if (typeof this.opt.onClose === "function") {
			this.opt.onClose();
		}

		// Remove no-scroll and paddingRight in body
		if (this.opt.enableScrollLock && !Popzy.modalList.length) {
			const target = this.opt.scrollLockTarget();

			if (this._hasScrollbar(target)) {
				target.classList.remove("popzy--no-scroll");
				target.style.paddingRight = "";
			}
		}
	});
};

Popzy.prototype.destroy = function () {
	this.close(true);
};
