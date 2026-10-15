
const CSS_TEXT: string[] = [
  // ---- 官方行上的标记 ----
  "[data-lo-row='1']{position:relative}",
  "[data-lo-draggable='1']{cursor:grab;-webkit-user-select:none;user-select:none;transition:opacity .14s ease,box-shadow .12s ease,transform .14s ease}",
  "[data-lo-draggable='1']:active{cursor:grabbing}",
  "[data-lo-dragging='1']{cursor:grabbing;opacity:.45}",
  "[data-lo-hidden='1']{display:none !important}",

  // 官方块与第三方块之间的分割线：同为 body 级元素，按 scope 各存一份。
  ".lo-divider{background:var(--dsw-alias-border-l2);border-radius:2px}",

  // ---- 浮层弹窗（右键菜单） ----
  // 描边用 box-shadow 而非 border；data-menu-material 是暗色主题钩子
  // 宽度贴内容：width:max-content、min-width:0、max-width:360px
  ".lo-pop{position:fixed;z-index:" + Z_MENU + ";box-sizing:border-box;width:max-content;min-width:0;max-width:360px;padding:4px;display:flex;flex-direction:column;gap:0;border:0;border-radius:var(--dsw-radius-lg,16px);isolation:isolate;--dsw-elevation-stroke-color:var(--dsw-alias-border-l1,#0000000a);box-shadow:var(--dsw-elevation-prominent,0 0 0 .5px var(--dsw-alias-border-l1,#0000000a),0 3px 8px 0 #0000000a,0 0 20px 0 #0000000d)}",
  ".lo-pop-material{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--dsw-menu-surface-fill,#f8f9fa94);backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));pointer-events:none}",
  ".lo-pop-viewport{display:flex;flex-direction:column;min-height:0}",
  ".lo-pop-wrap{position:relative}",
  ".lo-pop-item{display:flex;align-items:center;gap:6px;width:100%;min-height:34px;padding:6px 8px;border:0;border-radius:var(--dsw-radius-md,12px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
  ".lo-pop-item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}",
  ".lo-pop-item:focus-visible:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f);outline:none}",
  ".lo-pop-item:disabled{opacity:.4;cursor:not-allowed}",
  ".lo-pop-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center;color:var(--dsw-alias-menu-icon,currentColor)}",
  ".lo-pop-icon svg{width:14px;height:14px}",
  ".lo-pop-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

  // ---- 悬浮的收纳包启动器 ----
  // 位置全由行内样式给出：启动器可拖动，吸附到松手时所在的那条边。
  ".lo-launcher{position:fixed;z-index:" + Z_LAUNCHER + ";display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border:0;border-radius:999px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);font:inherit;font-size:12px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;transition:box-shadow .14s ease,opacity .14s ease}",
  ".lo-launcher:hover{box-shadow:0 10px 26px rgba(0,0,0,.34)}",
  ".lo-launcher[data-dragging='1']{cursor:grabbing;opacity:.85;transition:none}",
  ".lo-launcher-count{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 5px;border-radius:999px;background:rgba(127,127,127,.35);font-size:11px;line-height:1}",

  // ---- 收纳包面板 ----
  ".lo-mask{position:fixed;inset:0;z-index:" + Z_MASK + ";background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.32));backdrop-filter:blur(2px);animation:lo-fade .14s ease}",
  ".lo-stash{position:fixed;z-index:" + Z_STASH + ";top:50%;left:50%;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 32px));max-height:min(74vh,620px);display:flex;flex-direction:column;border-radius:16px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 24px 64px rgba(0,0,0,.34);overflow:hidden;animation:lo-rise .16s ease}",
  ".lo-stash-head{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
  ".lo-stash-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
  ".lo-stash-count{font-size:12px;color:var(--dsw-alias-label-secondary)}",
  ".lo-stash-close{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;cursor:pointer}",
  ".lo-stash-close:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}",
  ".lo-stash-sorts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:12px 16px 8px}",
  ".lo-stash-actions{display:flex;padding:0 16px 10px}",
  ".lo-stash-actions>.lo-btn{flex:1 1 auto}",
  ".lo-chip{padding:5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;text-align:center;transition:background .12s ease,border-color .12s ease,color .12s ease}",
  ".lo-chip[aria-pressed='true']{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}",
  ".lo-chip:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}",
  ".lo-chip[aria-pressed='true']:hover{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);filter:brightness(1.08)}",
  ".lo-stash-body{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 12px 14px;display:flex;flex-direction:column;gap:4px}",
  ".lo-stash-group{padding:12px 8px 6px;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}",
  ".lo-stash-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px}",
  ".lo-stash-row:hover{background:var(--dsw-alias-bg-layer-1)}",
  ".lo-stash-main{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:9px;padding:5px 2px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.45;text-align:left;cursor:pointer}",
  ".lo-stash-main:disabled{cursor:default;color:var(--dsw-alias-label-secondary)}",
  ".lo-stash-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".lo-tag{flex:0 0 auto;padding:2px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap}",
  ".lo-empty{padding:28px 20px;text-align:center;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",

  // ---- 设置页 ----
  // 负外边距收紧标题与导语的间距
  ".lo-page{display:flex;flex-direction:column;gap:14px;padding:2px 2px 12px}",
  ".lo-title{margin:0;line-height:1.3}",
  // 标题行：大标题靠左，导出 / 导入 / GitHub 三个按钮靠右。
  ".lo-titlerow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
  ".lo-titlerow .lo-title{flex:1 1 auto;min-width:0}",
  ".lo-titleacts{flex:0 0 auto;display:flex;gap:8px}",
  ".lo-notice{margin:-6px 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-success-primary,#2f9e44)}",
  ".lo-notice[data-tone='error']{color:var(--dsw-alias-state-error-primary,#ec1313)}",
  ".lo-lead{margin:-8px 0 -8px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
  ".lo-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}",
  ".lo-card-head{padding:11px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
  ".lo-card-body{display:flex;flex-direction:column}",
  ".lo-field{display:flex;align-items:center;gap:14px;padding:11px 14px;border-top:1px solid var(--dsw-alias-border-l1)}",
  ".lo-field:first-child{border-top:0}",
  ".lo-field[data-collapsible='1']{cursor:pointer;user-select:none}",
  ".lo-field-arrow{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:20px;color:var(--dsw-alias-label-secondary)}",
  ".lo-caret{display:inline-block;font-size:17px;line-height:1;transform:rotate(0deg);transition:transform .18s ease}",
  ".lo-field[data-collapsed='1'] .lo-caret{transform:rotate(0deg)}",
  ".lo-field:not([data-collapsed='1']) .lo-caret{transform:rotate(180deg)}",
  // 短横线占固定 14px 并悬挂在缩进区外，标题与描述因此从同一条竖线开始。
  ".lo-field-sub .lo-field-text{padding-left:14px}",
  ".lo-field-sub .lo-field-label{font-weight:500}",
  ".lo-sub-dash{display:inline-block;width:14px;margin-left:-14px;color:var(--dsw-alias-label-primary);opacity:.45}",
  ".lo-field-sub{background:var(--dsw-alias-bg-layer-2);border-top-style:dashed}",
  // 上级总开关关着：整行变灰表示「不生效」，但仍可点——点亮会顶起总开关。
  ".lo-field[data-gated='1']{opacity:.5}",
  ".lo-field-text{flex:1 1 auto;min-width:0}",
  ".lo-field-label{font-size:13px;color:var(--dsw-alias-label-primary)}",
  ".lo-field-hint{margin-top:3px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}",
  ".lo-field-control{flex:0 0 auto;display:flex;align-items:center;gap:8px}",
  ".lo-field[data-stack='1']{flex-direction:column;align-items:stretch;gap:8px}",
  // 控件区铺满整行并靠左，两端对齐交给 .lo-keyrow-end{margin-left:auto}
  ".lo-field[data-stack='1'] .lo-field-control{flex-wrap:wrap;justify-content:flex-start;width:100%}",

  ".lo-switch{position:relative;flex:0 0 auto;width:38px;height:22px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);cursor:pointer;transition:background .16s ease}",
  ".lo-switch[aria-checked='true']{background:var(--dsw-alias-brand-primary)}",
  ".lo-switch:disabled{opacity:.5;cursor:default}",
  ".lo-switch::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-switch-thumb);box-shadow:0 1px 3px rgba(0,0,0,.28);transition:transform .16s ease,background .16s ease}",
  ".lo-switch[aria-checked='true']::after{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground)}",

  ".lo-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;transition:background .12s ease,border-color .12s ease,color .12s ease}",
  ".lo-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}",
  ".lo-btn:disabled{opacity:.45;cursor:default}",
  ".lo-btn[data-variant='primary']{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}",
  // 主按钮悬停保持自己的配色
  ".lo-btn[data-variant='primary']:hover:not(:disabled){background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);filter:brightness(1.08)}",
  ".lo-btn[data-variant='ghost']{border-color:transparent}",
  ".lo-btn[data-size='icon']{width:28px;padding:0;font-size:13px}",

  ".lo-rows{display:flex;flex-direction:column;padding:4px 6px 8px}",
  ".lo-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;-webkit-user-select:none;user-select:none;transition:background .12s ease}",
  ".lo-row *{-webkit-user-select:none;user-select:none}",
  ".lo-row:hover{background:var(--dsw-alias-bg-layer-2)}",
  ".lo-row[data-hidden='1']{opacity:.5}",
  ".lo-row[data-dragging='1']{opacity:.4}",
  // 落点提示复用正文那两条虚线，不在行上画 box-shadow。
  ".lo-row[data-lo-dragging='1']{cursor:grabbing}",
  ".lo-grip{flex:0 0 auto;width:14px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1;letter-spacing:-1px;cursor:grab}",
  ".lo-grip[data-locked='1']{opacity:.28;cursor:default}",
  ".lo-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--dsw-alias-label-primary)}",
  ".lo-row-id{flex:0 0 auto;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}",
  ".lo-swatch{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-label-secondary)}",
  ".lo-swatch[data-kind='official']{background:var(--dsw-alias-brand-primary)}",
  ".lo-swatch[data-kind='third']{background:var(--dsw-alias-state-warn-primary)}",
  ".lo-groupbar{display:flex;align-items:center;gap:8px;padding:9px 8px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}",
  ".lo-groupbar::after{content:'';flex:1 1 auto;height:1px;background:var(--dsw-alias-border-l1)}",
  ".lo-note{padding:8px 14px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
  ".lo-warn{margin:0;padding:9px 13px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;font-size:12px;line-height:1.55;color:var(--dsw-alias-state-warn-primary)}",

  // ---- 快捷键编辑器 ----
  ".lo-keyrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%}",
  ".lo-keyrow-end{margin-left:auto}",
  ".lo-keys{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:30px;min-width:120px;padding:0 12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);font-size:12px;color:var(--dsw-alias-label-primary);cursor:pointer;transition:border-color .12s ease,color .12s ease}",
  ".lo-keys:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
  ".lo-keys[data-recording='1']{border-style:solid;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
  ".lo-keys[data-empty='1']{color:var(--dsw-alias-label-secondary)}",
  ".lo-key{padding:1px 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-layer-2);font-size:11px}",
  ".lo-shortcut-msg{display:block;padding:0 14px 10px;font-size:12px;line-height:1.5}",
  // 行内内边距清零，紧贴键帽框右侧
  ".lo-keyrow .lo-shortcut-msg{padding:0;flex:0 1 auto}",
  ".lo-shortcut-msg[data-tone='error']{color:var(--dsw-alias-state-error-primary)}",
  ".lo-shortcut-msg[data-tone='warn']{color:var(--dsw-alias-state-warn-primary)}",
  ".lo-shortcut-msg[data-tone='ok']{color:var(--dsw-alias-state-success-primary)}",

  "@keyframes lo-fade{from{opacity:0}to{opacity:1}}",
  "@keyframes lo-rise{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}"
];

let loStyleEl: HTMLStyleElement | null = null;

function installStyles(): void {
  const selector: string = 'style[data-plugin="' + PLUGIN_ID + '"]';
  const existing: HTMLStyleElement | null = document.querySelector<HTMLStyleElement>(selector);
  if (existing) {
    loStyleEl = existing;
    return;
  }
  const node: HTMLStyleElement = document.createElement("style");
  node.setAttribute("data-plugin", PLUGIN_ID);
  node.textContent = CSS_TEXT.join("\n");
  document.head.appendChild(node);
  loStyleEl = node;
}

function removeStyles(): void {
  const nodes: NodeListOf<HTMLStyleElement> = document.querySelectorAll<HTMLStyleElement>('style[data-plugin="' + PLUGIN_ID + '"]');
  for (let i: number = 0; i < nodes.length; i++) {
    const node: HTMLStyleElement = nodes[i];
    if (node.parentNode) node.parentNode.removeChild(node);
  }
  loStyleEl = null;
}