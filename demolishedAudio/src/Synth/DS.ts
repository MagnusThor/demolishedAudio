export class GPUSynth {


    onError: ((errorMessage: string) => void) | undefined

    static vs = `#version 300 es
      #ifdef GL_ES
        precision highp float;
        precision highp int;
        precision mediump sampler3D;
      #endif
      layout(location = 0) in vec2 pos; 
      out vec4 fragColor;
          void main() { gl_Position = vec4(2.0*pos-1.0, 0.0, 1.0);
      }`


      static timer:number;
  audioContext: AudioContext;


  constructor(){
      this.audioContext = new AudioContext();
  }

    /**
     * Create a generator
     * @static
     * @param {string} dsp
     * @param {number} sr
     * @param {number} w
     * @param {number} h
     * @returns generator function
     * @memberof Synth
     */
    Generate(dsp: string, sr: number, w: number, h: number) {
      let canvas = document.createElement("canvas");
      let g = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGLRenderingContext;
  
      let p = g.createProgram() as WebGLProgram
      let v = g.createShader(35633) as WebGLShader;
     
      g.shaderSource(v, GPUSynth.vs);
      
      g.compileShader(v);
      g.attachShader(p, v);


      
      let f = g.createShader(35632) as WebGLShader
  
      g.shaderSource(f, dsp);
      g.compileShader(f);
      g.attachShader(p, f);
  
      if(this.onError){
      if (!g.getShaderParameter(f, g.COMPILE_STATUS)) {   

        let errorMessage = new Array<string>();
        const logInfo = g.getShaderInfoLog(f);   
              
        if(logInfo){
          errorMessage = logInfo.trim().split("\n");
               this.onError(errorMessage.join(","));                           
            };
          }
      }    
  
      g.viewport(0, 0, w, h);
      g.linkProgram(p);
      g.useProgram(p);
      g.bindBuffer(34962, g.createBuffer());
      g.enableVertexAttribArray(0);
      g.vertexAttribPointer(0, 2, 5120, false, 0, 0);
  
      g.bufferData(34962, new Int8Array([-3, 1, 1, -3, 1, 1]), 35044);
  
      g.uniform1f(g.getUniformLocation(p, 'sampleRate'), sr);
      g.uniform2f(g.getUniformLocation(p, 'resolution'), w, h);
  
      return (t: number, c: number, _b?: any) => {
        var b = _b || new Uint8Array(w * h * 4);
        g.uniform1f(g.getUniformLocation(p, "bufferTime"), t / sr);
        g.uniform1f(g.getUniformLocation(p, "channel"), c);
        g.drawArrays(6, 0, 3);
        g.readPixels(0, 0, w, h, 6408, 5121, b);
        return b;
      };
    }

    Stop(){
      clearTimeout(GPUSynth.timer);

      if(this.audioContext.state == "closed") return;
      this.audioContext.close().then ( p => {

      });
    }

    /**
     * Playback for the generated sound
     *
     * @static
     * @param {Function} gen
     * @memberof Synth
     */

    Play(gen: Function) {
  
      var bffs = [] as Array<any>;
      var abt = 0;
      var aat = 0;
  
      this.audioContext = new AudioContext();
      var d = this.audioContext.createGain();
      var dc = this.audioContext.createDynamicsCompressor();
      var g = this.audioContext.createGain();
  
      g.gain.value = 0.6;
      d.connect(dc);
      dc.connect(g);
      g.connect(this.audioContext.destination);
  
      const w = 128;
      const h = 64;
  
      const buffer = (bt: number, at: number) => {

        var bufferSource = this.audioContext.createBufferSource();
        bufferSource.connect(d);
        var buff = gen(bt, 0);
        var ab = this.audioContext.createBuffer(2, buff.length, this.audioContext.sampleRate);
        ab.getChannelData(0).set(buff);
        gen(bt, 1, buff);
        ab.getChannelData(1).set(buff);
        bufferSource.buffer = ab;
        bufferSource.start(at);

        bffs.push({
          data: buff,
          width: w,
          height: h,
          bufferTime: bt,
          destroy: function () {
            bufferSource.disconnect(d);
          }
        });

        return {
          b: bt + buff.length,
          t: at + ab.duration
        };

      }

      const note = () => {
        var res = buffer(abt, aat);
        abt = res.b;
        aat = res.t;
      }
  
      const loop = () => {

        bffs = bffs.filter( (b) => {
          if (b.bufferTime + b.data.length < Math.floor(this.audioContext.currentTime * this.audioContext.sampleRate)) {
            b.destroy();
            return false;
          }
          return true;
        });
        if (gen && this.audioContext.currentTime + 8 > aat) {
          note();
        }
        GPUSynth.timer =   setTimeout(loop, 100);
      };
    
      clearTimeout(GPUSynth.timer);
    
      loop();
  
    }
  }
  
  