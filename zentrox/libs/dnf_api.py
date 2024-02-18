import dnf

# Initialize the DNF Base object
base = dnf.Base()

# Load the DNF configuration
base.read_all_repos()

# Optionally, enable/disable repositories
# base.repos.disable("repo_name")

# Optionally, set additional options
# base.conf.assumeyes = True

# Install a package
with base.transaction as tx:
    tx.install("package_name")

# Remove a package
with base.transaction as tx:
    tx.remove("package_name")

# Optionally, update all packages
# with base.transaction() as tx:
#     tx.update()

# Run the transaction
base.resolve()

# Commit the transaction
base.do_transaction()
