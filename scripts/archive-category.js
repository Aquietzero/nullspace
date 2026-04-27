/**
 * 在归档/分类/标签列表页的文章项右侧显示 category 标签
 * 通过 Hexo filter 注入 JS，根据文章 URL 匹配 category 并动态插入 DOM
 */
hexo.extend.filter.register('after_render:html', function (str) {
  // 只对包含 posts-collapse 的页面生效（archive、category、tag 列表页）
  if (str.indexOf('posts-collapse') === -1) return str;

  // 构建文章 URL → category 映射（使用 encodeURI 确保中文路径编码一致）
  const posts = hexo.locals.get('posts');
  const mapping = {};
  posts.forEach(function (post) {
    const url = encodeURI(hexo.config.root + post.path);
    const cats = [];
    if (post.categories && post.categories.length) {
      post.categories.forEach(function (cat) {
        cats.push({ name: cat.name, path: encodeURI(hexo.config.root + cat.path) });
      });
    }
    if (cats.length > 0) {
      mapping[url] = cats;
    }
  });

  const script = `
<script>
(function() {
  var mapping = ${JSON.stringify(mapping)};
  var container = document.querySelector('.posts-collapse');
  if (!container) return;
  var links = container.querySelectorAll('.post-title a.post-title-link');
  links.forEach(function(a) {
    var href = a.getAttribute('href');
    var cats = mapping[href];
    if (!cats || !cats.length) return;
    // 取最后一级 category
    var cat = cats[cats.length - 1];
    var tag = document.createElement('a');
    tag.href = cat.path;
    tag.className = 'archive-category-tag';
    tag.textContent = cat.name;
    var header = a.closest('.post-header');
    if (header) {
      header.appendChild(tag);
    }
  });
})();
</script>`;

  return str.replace('</body>', script + '</body>');
});
