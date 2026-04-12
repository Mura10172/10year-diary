# 作業ルール

## 変更フロー

1. ユーザーが要望を記載
2. Claude が要望を整理して変更点を確認
3. ユーザーが OK
4. Claude が変更およびデプロイ（git commit + git push）を実施
5. デプロイ完了後にユーザーへ報告、完了時刻を表示

## 権限

- このプロジェクト内では全操作を自動許可（確認不要）

---

## 開発環境・ツール

### パス指定
- ファイルアクセスは必ず以下の変数経由で行う:
  PROJ=$(find /c/Users/takes -maxdepth 6 -name "package.json" -path "*/10year-diary/*" | head -1 | sed 's|/package.json||')
- Write ツールや直接パス指定は文字コード正規化の差異で別ファイルに書き込まれることがある
- ファイルの書き込みは Bash + Node.js で行う（Write ツールは使わない）

### Python は使用不可
- hooks にインターセプトされて exit code 49 で落ちる
- ファイル操作・スクリプト実行は Node.js を使う

---

## Google Sheets 連携

- **シート名のデフォルトは「シート１」**（英語の "Sheet1" ではなく）
- **日付列は書式なしテキスト**（スプレッドシートの日付型にしない）
- **列順**: A=日付, B=投稿１, C=投稿２, D=★１, E=★２, F=作成日時, G=更新日時

---

## UI / UX ルール

- **スワイプ方向**: 右スワイプ = 過去・古い方向、左スワイプ = 未来・新しい方向
- **ボタン方向**: ‹ = 過去・古い方向、› = 未来・新しい方向

### タッチスワイプの実装方針
React の合成イベント（onTouchMove 等）ではなく、ネイティブの addEventListener を使う:
- el.addEventListener("touchstart", onStart, { passive: true })
- el.addEventListener("touchmove", onMove, { passive: false })  // e.preventDefault() のために非パッシブ
- el.addEventListener("touchend", onEnd, { passive: true })
- タッチ座標・dragDelta は state ではなく useRef で管理（stale state 問題を回避）
- 横縦どちらのスワイプかを最初の動きで判定し、横スワイプ確定後に e.preventDefault() を呼ぶ

---

## 作業フロー補足

- **変更前に必ず内容を確認してからユーザーの OK をもらう**
