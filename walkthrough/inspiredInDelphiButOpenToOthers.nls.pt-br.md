## Inspirado no Delphi, mas aberto a outros

A extensão foi inspirada no Delphi, pois eu fui um desenvolvedor Delphi por muito tempo, e adoro seus bookmarks. Mas ele suporta diferentes editores também. 

Para mudar um pouco como a extensão funciona (alternar e navegar), basta brincar com a configuração `numberedBookmarks.navigateThroughAllFiles`:

Valor | Explicação
--------- | ---------
`false` | _padrão_ - mesmo comportamento de hoje
`replace` | você não pode ter o mesmo numbered bookmark em arquivos distintos
`allowDuplicates` | você pode ter o mesmo numbered bookmark em arquivos distintos, e se você acionar repetidamente ao mesmo número, ele irá olhar para os outros arquivos.

### Desenvolvedores IntelliJ / UltraEdit

Se você é um usuário do **IntelliJ** ou **UltraEdit**, você vai notar que o numbered bookmarks funciona um pouco diferente do seu comportamento padrão.

Para fazer **Numbered Bookmarks** funcionar do mesmo jeito dessas ferramentas, simplesmente adicione `"numberedBookmarks.navigateThroughAllFiles": replace"` nas suas configurações e aproveite.

<table align="center" width="85%" border="0">
  <tr>
    <td align="center">
      <a title="Abrir Configurações" href="command:workbench.action.openSettings?%5B%22numberedBookmarks.navigateThroughAllFiles%22%5D">Abrir Configurações</a>
    </td>
  </tr>
</table>