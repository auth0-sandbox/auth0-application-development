<script setup>
import { setUser } from '../services/index.js'

var user = { name: route.query.name || 'Anonymous', picture: route.query.picture || '' }
setUser(user)
router.push('/')
</script>