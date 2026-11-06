import { assert, describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/jis0208.js";
import { lookupJis0208CodePoint } from "../shared/lookupJis0208CodePoint.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as shift_jis from "./shift_jis.js";

const jis0208UniqueCodepoints = Array.from(
  "纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑ⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹ￤＇＂",
  (val) => val.codePointAt(0)!,
);

jis0208UniqueCodepoints
  .map(lookupJis0208CodePoint)
  .forEach((jis0208Pointer) => {
    assert(0x2050 <= jis0208Pointer && jis0208Pointer <= 0x2283);
  });

// Every character covered by the Shift JIS index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const shift_jis_index = Array.from(cpStarts)
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

describe("Shift JIS", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("月が綺麗ですね。".encode("shift_jis").hex())'
      expect(shift_jis.encode("月が綺麗ですね。")).toEqual(
        Uint8Array.fromHex("8c8e82aae35997ed82c582b782cb8142"),
      );

      // python3 -c 'print("祇園精舍の鐘の声、諸行無常の響きあり。".encode("shift_jis").hex())'
      expect(
        shift_jis.encode("祇園精舍の鐘の声、諸行無常の響きあり。"),
      ).toEqual(
        Uint8Array.fromHex(
          "8b5f898090b8e47182cc8fe082cc90ba81418f948d7396b38fed82cc8bbf82ab82a082e88142",
        ),
      );

      // python3 -c 'print("だって… あの さっき チェンソーで戦ってたから……".encode("shift_jis").hex())'
      expect(
        shift_jis.encode("だって… あの さっき チェンソーで戦ってたから……"),
      ).toEqual(
        Uint8Array.fromHex(
          "82be82c182c481632082a082cc2082b382c182ab20836083468393835c815b82c590ed82c182c482bd82a982e781638163",
        ),
      );
    });

    it("encodes ¥ as \\", () => {
      const encodedInput = shift_jis.encode("¥");
      expect(encodedInput).toEqual(new Uint8Array(["\\".charCodeAt(0)]));
      expect(shift_jis.decode(encodedInput)).toBe("\\");
    });

    it("encodes ‾ as ~", () => {
      const encodedInput = shift_jis.encode("‾");
      expect(encodedInput).toEqual(new Uint8Array(["~".charCodeAt(0)]));
      expect(shift_jis.decode(encodedInput)).toBe("~");
    });

    it("encodes − as －", () => {
      const encodedInput = shift_jis.encode("−");
      expect(encodedInput).toEqual(shift_jis.encode("－"));
      expect(shift_jis.decode(encodedInput)).toBe("－");
    });

    // The Shift_JIS encoder excludes pointers 0x2050 to 0x2283 (NEC-selected
    // IBM extensions - leading byte 0xED and 0xEE), so encode these characters
    // with duplicate pointer in the IBM extension area (leading byte 0xFA to 0xFC)
    // or an earlier JIS0208 pointer
    it("never encodes using NEC selected IBM extensions", () => {
      expect.hasAssertions();
      [0xed, 0xee].forEach((leading) =>
        Array.from({ length: 0xfc - 0x40 + 1 }, (_, i) => i + 0x40).forEach(
          (trailing) => {
            if (trailing === 0x7f) {
              return;
            }
            const char = shift_jis.decode(new Uint8Array([leading, trailing]));
            if (char.length === 0 || char === "\uFFFD") {
              return;
            }
            const encodedChar = shift_jis.encode(char);
            expect(encodedChar).toHaveLength(2);
            expect(encodedChar[0]).not.toBeOneOf([0xed, 0xee]);
            expect(shift_jis.decode(encodedChar)).toBe(char);
          },
        ),
      );
    });

    it("encodes NEC selected IBM extensions as IBM extensions", () => {
      // 0xED40 is a duplicate of 0xFA5C
      expect(shift_jis.encode("纊")).toEqual(new Uint8Array([0xfa, 0x5c]));
      // 0xEEEF is a duplicate of 0xFA40
      expect(shift_jis.encode("ⅰ")).toEqual(new Uint8Array([0xfa, 0x40]));
    });

    it("encodes unknown characters as ?", () => {
      const encodedInput = shift_jis.encode("🈲");
      expect(encodedInput).toEqual(shift_jis.encode("?"));
      expect(shift_jis.decode(encodedInput)).toBe("?");
    });
  });

  // The codec does not actually survive roundtrip conversion per the spec: "¥"
  // returns "\" and "‾" returns "~" due to ASCII compatibility
  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "U+0080 (PAD)": String.fromCodePoint(0x80),
        "half-width kana": String.fromCodePoint(
          ...Array.from({ length: 0xff9f - 0xff61 }, (_, i) => i + 0xff61),
        ),
        "Shift_JIS index": shift_jis_index,
        "JIS0208 excluded codepoints": String.fromCodePoint(
          ...jis0208UniqueCodepoints,
        ),
      }),
    )("%s", ([, input]) => {
      expect(shift_jis.decode(shift_jis.encode(input))).toBe(input);
    });
  });
});
