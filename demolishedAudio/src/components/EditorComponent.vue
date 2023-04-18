<template>


<div class="container-fluid">
<div class="row ">
  <div class="col-md-12">

  <Codemirror v-model="code" placeholder="Code goes here..." :style="{ height: '75vh' }" :autofocus="true"
    :indent-with-tab="true" :tab-size="2" :extensions="extensions" @change="update" />

    <div class="mt-4">

<button type="button" @click="compile()" class="btn btn-light mx-2" v-bind:class="error.hasError ? 'btn-danger':'btn-success'">
  Compile
</button>

<button type="button" @click="play()" v-bind:disabled="error.hasError" class="btn mx-2" v-bind:class="error.hasError ? 'btn-warning':'btn-success'">
  Play
</button>
<button type="button" @click="stop()" v-bind:disabled="error.hasError" class="btn mx-2" v-bind:class="error.hasError ? 'btn-warning':'btn-success'">
  Stop
</button>
</div>
  </div>
</div>

<div class="row">
  <div class="col-md-12 my-4">
    <div class="alert alert-info">
      <h4 class="alert-heading">
        Immediate
      </h4>
      {{ error.message }}
    </div>
  </div>
</div>

</div>

 

  
</template>


<script lang="ts">
import { compile, defineComponent, reactive, ref, shallowRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

import { GPUSynth } from '../Synth/DS'


import { debounce } from 'vue-debounce'
import { myAudio } from '@/assets/song'



export default defineComponent({

  components: {
    Codemirror
  },
 
  setup() {


    let generatedSong: any;
    let synth = new GPUSynth();

    const error = reactive({
      message:'',
      hasError: true
    })

    let source = "";

    synth.onError = (err) => {
      error.message = err;

      error.hasError =  err.length > 0;
   
    }

    const code = ref(myAudio)
    const extensions = [javascript(), oneDark]

    const view = shallowRef()

    const handleReady = (payload: any) => {
      view.value = payload.view
    }

    const compile = () => {
      stop();
      error.message = "";
      error.hasError = true;
      if (source.length === 0) return;
      generatedSong = synth.Generate(source, 44100, 128, 64)
      error.hasError = error.message.length > 0;

      
      clearTimeout(GPUSynth.timer);
    }


    const update = debounce((code: string) => {
      error.message = "";
      source = code; 
    }, 500)


    const stop = () => {

      synth.Stop();
    }

    const play = () => {
      synth.Play(generatedSong);
    }

    

    return {
      code,
      extensions,
      handleReady,
      update,
      play,
      stop,
      error,
      compile,
    
    }

  }
})
</script>