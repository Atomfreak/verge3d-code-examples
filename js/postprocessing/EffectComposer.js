/**
 * @author alteredq / http://alteredqualia.com/
 */

v3d.EffectComposer = function(renderer, renderTarget) {

    this.renderer = renderer;

    if (renderTarget === undefined) {

        var parameters = {
            minFilter: v3d.LinearFilter,
            magFilter: v3d.LinearFilter,
            format: v3d.RGBAFormat,
            stencilBuffer: false
        };

        var size = renderer.getDrawingBufferSize();
        renderTarget = new v3d.WebGLRenderTarget(size.width, size.height, parameters);
        renderTarget.texture.name = 'EffectComposer.rt1';

    }

    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = 'EffectComposer.rt2';

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    this.passes = [];

    // dependencies

    if (v3d.CopyShader === undefined) {

        console.error('v3d.EffectComposer relies on v3d.CopyShader');

    }

    if (v3d.ShaderPass === undefined) {

        console.error('v3d.EffectComposer relies on v3d.ShaderPass');

    }

    this.copyPass = new v3d.ShaderPass(v3d.CopyShader);

};

Object.assign(v3d.EffectComposer.prototype, {

    swapBuffers: function() {

        var tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    },

    addPass: function(pass) {

        this.passes.push(pass);

        var size = this.renderer.getDrawingBufferSize();
        pass.setSize(size.width, size.height);

    },

    insertPass: function(pass, index) {

        this.passes.splice(index, 0, pass);

    },

    render: function(delta) {

        var maskActive = false;

        var pass, i, il = this.passes.length;

        for (i = 0; i < il; i++) {

            pass = this.passes[i];

            if (pass.enabled === false) continue;

            pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

            if (pass.needsSwap) {

                if (maskActive) {

                    var context = this.renderer.context;

                    context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);

                    this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);

                    context.stencilFunc(context.EQUAL, 1, 0xffffffff);

                }

                this.swapBuffers();

            }

            if (v3d.MaskPass !== undefined) {

                if (pass instanceof v3d.MaskPass) {

                    maskActive = true;

                } else if (pass instanceof v3d.ClearMaskPass) {

                    maskActive = false;

                }

            }

        }

    },

    reset: function(renderTarget) {

        if (renderTarget === undefined) {

            var size = this.renderer.getDrawingBufferSize();

            renderTarget = this.renderTarget1.clone();
            renderTarget.setSize(size.width, size.height);

        }

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    },

    setSize: function(width, height) {

        this.renderTarget1.setSize(width, height);
        this.renderTarget2.setSize(width, height);

        for (var i = 0; i < this.passes.length; i++) {

            this.passes[i].setSize(width, height);

        }

    }

});


v3d.Pass = function() {

    // if set to true, the pass is processed by the composer
    this.enabled = true;

    // if set to true, the pass indicates to swap read and write buffer after rendering
    this.needsSwap = true;

    // if set to true, the pass clears its buffer before rendering
    this.clear = false;

    // if set to true, the result of the pass is rendered to screen
    this.renderToScreen = false;

};

Object.assign(v3d.Pass.prototype, {

    setSize: function(width, height) {},

    render: function(renderer, writeBuffer, readBuffer, delta, maskActive) {

        console.error('v3d.Pass: .render() must be implemented in derived pass.');

    }

});
