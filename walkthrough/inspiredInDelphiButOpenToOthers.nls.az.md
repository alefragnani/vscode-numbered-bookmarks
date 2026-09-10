## Delphi-dən ilhamlanıb, lakin digərlərinə də açıqdır

Uzun müddət Delphi tərtibatçısı olduğum və onun bookmark-larını sevdiyim üçün bu genişlənmə Delphi-dən ilhamlanıb. Lakin digər redaktorları da dəstəkləyir.

Genişlənmənin işini (açıb-bağlama və keçid) bir qədər dəyişmək üçün sadəcə `numberedBookmarks.navigateThroughAllFiles` parametrini dəyişin:

Dəyər | İzah
--------- | ---------
`false` | _standart_ - indiki ilə eyni davranış
`replace` | müxtəlif fayllarda eyni nömrəli bookmark ola bilməz
`allowDuplicates` | müxtəlif fayllarda eyni nömrəli bookmark ola bilər və eyni nömrəyə təkrar keçid etdikdə digər fayllarda axtarış aparılacaq.

### IntelliJ / UltraEdit tərtibatçıları

**IntelliJ** və ya **UltraEdit** istifadəçisinizsə, nömrələnmiş bookmark-ların standart davranışdan bir qədər fərqli işlədiyini görəcəksiniz. 

**Numbered Bookmarks** genişlənməsinin bu alətlərlə eyni şəkildə işləməsi üçün parametrlərinizə sadəcə `"numberedBookmarks.navigateThroughAllFiles": replace"` əlavə edin və hər şey hazırdır.

<table align="center" width="85%" border="0">
  <tr>
    <td align="center">
      <a title="Parametrləri aç" href="command:workbench.action.openSettings?%5B%22numberedBookmarks.navigateThroughAllFiles%22%5D">Parametrləri aç</a>
    </td>
  </tr>
</table>