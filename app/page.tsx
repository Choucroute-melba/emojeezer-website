import {ThemeImage} from "@/lib/Components/ThemeImage";

export default function Home() {
  return (
      <>
          <div className={"h-full max-w-5xl flex flex-col items-center justify-start mt-5 "}>
              <ThemeImage alt={"Emojeezer Logo"} srcLight={"./ej-logo-light-v.svg"} srcDark={"./ej-logo-dark-v.svg"}
                          width={400} height={200} />
              <h1 className={"text-center mt-10"}>The One addon for emoji autocomplete in firefox</h1>
              <div className={"w-full flex justify-center mt-10"}>
                  <a href={"https://addons.mozilla.org/en-US/firefox/addon/emojeezer/"}
                     className={"button primary w-1/3 h-11"}>
                      Install
                  </a>
              </div>
          </div>
      </>
  );
}
